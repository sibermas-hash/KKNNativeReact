interface DashboardCardProps {
  title: string;
  value: number | string;
}

export default function DashboardCard({ title, value }: DashboardCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-3xl font-bold text-primary mt-2">{value}</p>
    </div>
  );
}
