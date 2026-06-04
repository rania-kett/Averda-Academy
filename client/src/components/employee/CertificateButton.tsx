import { Certificate } from "@/components/employee/Certificate";

type Props = {
  allCoursesCompleted: boolean;
  avgScore: number;
  employee: { name: string; role: string; programName?: string; completionDate: string };
};

export function CertificateButton({ allCoursesCompleted, avgScore, employee }: Props) {
  if (!allCoursesCompleted || avgScore < 70) return null;

  return (
    <Certificate
      employeeName={employee.name}
      role={employee.role}
      programName={employee.programName}
      score={avgScore}
      date={employee.completionDate}
      showPreview={false}
      showExport
    />
  );
}
