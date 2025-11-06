import type { Scenario } from '@/types';
import { get } from '@/utils/request';
import { defineStore } from 'pinia';
import { ref } from 'vue';

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

