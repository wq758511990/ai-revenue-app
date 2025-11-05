import { defineStore } from 'pinia';
import { ref } from 'vue';
import { get } from '@/utils/request';

export interface Scenario {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  platform: string;
  inputSchema: any;
  defaultToneStyle: string;
}

export const useScenarioStore = defineStore('scenario', () => {
  const scenarios = ref<Scenario[]>([]);
  const currentScenario = ref<Scenario | null>(null);
  const loading = ref(false);

  const fetchScenarios = async () => {
    try {
      loading.value = true;
      const data = await get<Scenario[]>('/scenarios', undefined, false);
      scenarios.value = data;
    } catch (error) {
      console.error('获取场景列表失败:', error);
    } finally {
      loading.value = false;
    }
  };

  const setCurrentScenario = (scenario: Scenario) => {
    currentScenario.value = scenario;
  };

  return {
    scenarios,
    currentScenario,
    loading,
    fetchScenarios,
    setCurrentScenario,
  };
});

