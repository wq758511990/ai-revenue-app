import axios from 'axios';
import crypto from 'crypto';
import { config } from '../config';
import { APP_NAME } from '../constants/app.constants';
import logger from '../utils/logger';
import { orderService } from './order.service';

/**
 * 微信支付服务
 * 集成微信支付V3 API
 */
export class PaymentService {
  private readonly appId: string;
  private readonly mchId: string;
  private readonly apiKey: string;
  private readonly notifyUrl: string;

  constructor() {
    this.appId = config.wechat.appId;
    this.mchId = config.wechat.mchId;
    this.apiKey = config.wechat.apiKey;
    this.notifyUrl = config.wechat.paymentNotifyUrl;
  }

  /**
   * 创建微信小程序支付参数
   */
  async createWeChatPayment(order: any): Promise<{
    timeStamp: string;
    nonceStr: string;
    package: string;
    signType: string;
    paySign: string;
  }> {
    try {
      // 1. 调用统一下单API
      const prepayId = await this.unifiedOrder(order);

      // 2. 生成小程序支付参数
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const nonceStr = this.generateNonceStr();
      const packageStr = `prepay_id=${prepayId}`;

      // 3. 签名
      const paySign = this.generatePaySign({
        appId: this.appId,
        timeStamp: timestamp,
        nonceStr,
        package: packageStr,
      });

      return {
        timeStamp: timestamp,
        nonceStr,
        package: packageStr,
        signType: 'MD5',
        paySign,
      };
    } catch (error) {
      logger.error('Failed to create WeChat payment', { error, orderId: order.id });
      throw new Error('Failed to create WeChat payment');
    }
  }

  /**
   * 统一下单API
   */
  private async unifiedOrder(order: any): Promise<string> {
    const params = {
      appid: this.appId,
      mch_id: this.mchId,
      nonce_str: this.generateNonceStr(),
      body: this.getOrderDescription(order),
      out_trade_no: order.orderNo,
      total_fee: Math.round(Number(order.amount) * 100), // 转换为分
      spbill_create_ip: '127.0.0.1',
      notify_url: this.notifyUrl,
      trade_type: 'JSAPI',
      openid: order.user?.openId || '',
    };

    // 生成签名
    const sign = this.generateSign(params);
    const requestData = { ...params, sign };

    // 转换为XML
    const xml = this.objectToXml(requestData);

    try {
      const response = await axios.post('https://api.mch.weixin.qq.com/pay/unifiedorder', xml, {
        headers: { 'Content-Type': 'text/xml' },
        timeout: 10000,
      });

      const result = this.xmlToObject(response.data);

      if (result.return_code !== 'SUCCESS') {
        throw new Error(`UnifiedOrder failed: ${result.return_msg}`);
      }

      if (result.result_code !== 'SUCCESS') {
        throw new Error(`UnifiedOrder failed: ${result.err_code} - ${result.err_code_des}`);
      }

      logger.info('UnifiedOrder success', {
        orderNo: order.orderNo,
        prepayId: result.prepay_id,
      });

      return result.prepay_id;
    } catch (error) {
      logger.error('UnifiedOrder API failed', { error, orderNo: order.orderNo });
      throw error;
    }
  }

  /**
   * 处理支付回调通知
   */
  async handlePaymentNotify(xmlData: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const data = this.xmlToObject(xmlData);

      // 1. 验证签名
      if (!this.verifySign(data)) {
        logger.error('Payment notify signature verification failed', { data });
        return { success: false, message: 'Signature verification failed' };
      }

      // 2. 检查返回状态
      if (data.return_code !== 'SUCCESS' || data.result_code !== 'SUCCESS') {
        logger.error('Payment notify failed', { data });
        return { success: false, message: 'Payment failed' };
      }

      // 3. 查询订单
      const order = await orderService.getOrderByOrderNo(data.out_trade_no);
      if (!order) {
        logger.error('Order not found in payment notify', { orderNo: data.out_trade_no });
        return { success: false, message: 'Order not found' };
      }

      // 4. 幂等性检查：如果订单已支付，直接返回成功
      if (order.status === 'PAID') {
        logger.info('Order already paid (idempotent)', { orderNo: order.orderNo });
        return { success: true, message: 'Order already paid' };
      }

      // 5. 更新订单状态
      await orderService.markOrderAsPaid({
        orderNo: data.out_trade_no,
        transactionId: data.transaction_id,
      });

      // 6. 激活会员或增加配额（在 controller 中处理）

      logger.info('Payment notify processed successfully', {
        orderNo: data.out_trade_no,
        transactionId: data.transaction_id,
      });

      return { success: true, message: 'Payment processed successfully' };
    } catch (error) {
      logger.error('Failed to handle payment notify', { error });
      return { success: false, message: 'Internal error' };
    }
  }

  /**
   * 查询订单支付状态
   */
  async queryOrderStatus(orderNo: string): Promise<{
    paid: boolean;
    transactionId?: string;
  }> {
    const params = {
      appid: this.appId,
      mch_id: this.mchId,
      out_trade_no: orderNo,
      nonce_str: this.generateNonceStr(),
    };

    const sign = this.generateSign(params);
    const requestData = { ...params, sign };
    const xml = this.objectToXml(requestData);

    try {
      const response = await axios.post('https://api.mch.weixin.qq.com/pay/orderquery', xml, {
        headers: { 'Content-Type': 'text/xml' },
        timeout: 10000,
      });

      const result = this.xmlToObject(response.data);

      if (result.return_code === 'SUCCESS' && result.result_code === 'SUCCESS') {
        const paid = result.trade_state === 'SUCCESS';
        return {
          paid,
          transactionId: paid ? result.transaction_id : undefined,
        };
      }

      return { paid: false };
    } catch (error) {
      logger.error('Failed to query order status', { error, orderNo });
      throw error;
    }
  }

  /**
   * 生成随机字符串
   */
  private generateNonceStr(length: number = 32): string {
    return crypto
      .randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .substring(0, length);
  }

  /**
   * 生成签名
   */
  private generateSign(params: Record<string, any>): string {
    // 1. 过滤空值和sign字段
    const filteredParams = Object.keys(params)
      .filter((key) => params[key] !== '' && params[key] !== undefined && key !== 'sign')
      .sort()
      .reduce((obj, key) => {
        obj[key] = params[key];
        return obj;
      }, {} as Record<string, any>);

    // 2. 拼接字符串
    const stringA = Object.keys(filteredParams)
      .map((key) => `${key}=${filteredParams[key]}`)
      .join('&');

    const stringSignTemp = `${stringA}&key=${this.apiKey}`;

    // 3. MD5加密并转大写
    return crypto.createHash('md5').update(stringSignTemp, 'utf8').digest('hex').toUpperCase();
  }

  /**
   * 生成小程序支付签名
   */
  private generatePaySign(params: {
    appId: string;
    timeStamp: string;
    nonceStr: string;
    package: string;
  }): string {
    const stringA = `appId=${params.appId}&nonceStr=${params.nonceStr}&package=${params.package}&signType=MD5&timeStamp=${params.timeStamp}`;
    const stringSignTemp = `${stringA}&key=${this.apiKey}`;
    return crypto.createHash('md5').update(stringSignTemp, 'utf8').digest('hex').toUpperCase();
  }

  /**
   * 验证签名
   */
  private verifySign(data: Record<string, any>): boolean {
    const receivedSign = data.sign;
    const calculatedSign = this.generateSign(data);
    return receivedSign === calculatedSign;
  }

  /**
   * 对象转XML
   */
  private objectToXml(obj: Record<string, any>): string {
    let xml = '<xml>';
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        xml += `<${key}><![CDATA[${obj[key]}]]></${key}>`;
      }
    }
    xml += '</xml>';
    return xml;
  }

  /**
   * XML转对象
   */
  private xmlToObject(xml: string): Record<string, any> {
    const obj: Record<string, any> = {};
    const regex = /<(\w+)>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/\1>/g;
    let match;

    while ((match = regex.exec(xml)) !== null) {
      obj[match[1]] = match[2];
    }

    return obj;
  }

  /**
   * 生成订单描述
   */
  private getOrderDescription(order: any): string {
    if (order.orderType === 'MEMBERSHIP') {
      const membershipNames: Record<string, string> = {
        MONTHLY: '月度会员',
        YEARLY: '年度会员',
      };
      return `${APP_NAME}-${membershipNames[order.membershipType || 'MONTHLY']}`;
    } else {
      return `${APP_NAME}-购买${order.quantity}次`;
    }
  }

  /**
   * 生成支付成功的XML响应
   */
  generateSuccessXml(): string {
    return this.objectToXml({
      return_code: 'SUCCESS',
      return_msg: 'OK',
    });
  }

  /**
   * 生成支付失败的XML响应
   */
  generateFailXml(message: string): string {
    return this.objectToXml({
      return_code: 'FAIL',
      return_msg: message,
    });
  }
}

export const paymentService = new PaymentService();

