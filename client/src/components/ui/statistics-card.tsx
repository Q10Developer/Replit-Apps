import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatisticsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
}

const StatisticsCard = ({
  title,
  value,
  icon: Icon,
  iconBgColor = "bg-primary-100",
  iconColor = "text-primary-600",
}: StatisticsCardProps) => {
  return (
    <Card className="bg-white overflow-hidden shadow">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconBgColor} rounded-md p-3`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="text-lg font-semibold text-gray-900">
                {value}
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatisticsCard;
