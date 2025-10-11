import { Stat, StatHelpText, StatLabel, StatNumber, chakra } from "@chakra-ui/react";
import { Card } from "@/components/ui/card";
import type { Metrics } from "../types";

const METRIC_DEFINITIONS: Array<{
  key: keyof Metrics;
  label: string;
  helper?: string;
  formatter?: (value: number) => string;
}> = [
  { key: "totalUsers", label: "총 가입자" },
  {
    key: "activeUsers",
    label: "프로필 완료",
    helper: "완료율을 지속적으로 추적"
  },
  { key: "pendingProfiles", label: "프로필 미완료" },
  { key: "adminUsers", label: "관리자 계정" },
  {
    key: "totalWorkspaces",
    label: "워크스페이스",
    helper: "생성된 프로젝트 수"
  },
  {
    key: "automationEnabled",
    label: "자동화 사용",
    helper: "Automation 활성화 워크스페이스"
  },
  {
    key: "digestEnabled",
    label: "다이제스트 사용",
    helper: "Digest 메일 활성화"
  },
  {
    key: "averageTeamSize",
    label: "평균 팀 규모",
    formatter: (value) => `${value.toFixed(1)}명`
  }
];

const GRADIENTS = [
  "linear(45deg, rgba(14,165,233,0.28) 0%, rgba(14,165,233,0) 65%)",
  "linear(60deg, rgba(168,85,247,0.28) 0%, rgba(168,85,247,0) 65%)",
  "linear(45deg, rgba(249,115,22,0.28) 0%, rgba(249,115,22,0) 65%)",
  "linear(60deg, rgba(34,197,94,0.28) 0%, rgba(34,197,94,0) 65%)"
];

export function MetricsOverview({ metrics }: { metrics: Metrics }) {
  return (
    <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
      {METRIC_DEFINITIONS.map(({ key, label, helper, formatter }, index) => {
        const value = metrics[key];
        const gradient = GRADIENTS[index % GRADIENTS.length];
        return (
          <Card
            key={key}
            className="relative overflow-hidden border-white/10 bg-white/5/80 shadow-[0_20px_45px_rgba(15,23,42,0.45)] backdrop-blur"
          >
            <chakra.div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-90"
              style={{ background: GRADIENTS[index % GRADIENTS.length] }}
            />
            <div className="relative p-6">
              <Stat>
                <StatLabel className="text-xs uppercase tracking-[0.3em] text-slate-200/80">{label}</StatLabel>
                <StatNumber className="mt-2 text-3xl font-semibold text-white">
                  {formatter ? formatter(Number(value)) : value.toLocaleString("ko-KR")}
                </StatNumber>
                {helper ? (
                  <StatHelpText className="mt-2 text-xs text-slate-200/75">{helper}</StatHelpText>
                ) : null}
              </Stat>
            </div>
          </Card>
        );
      })}
    </section>
  );
}
