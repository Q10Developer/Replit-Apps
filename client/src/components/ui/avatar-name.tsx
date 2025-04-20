interface AvatarNameProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

const getRandomColor = (name: string): string => {
  // Generate a consistent color based on the name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Use a fixed set of colors for consistency
  const colors = [
    'bg-blue-200 text-blue-700',
    'bg-green-200 text-green-700',
    'bg-purple-200 text-purple-700',
    'bg-yellow-200 text-yellow-700',
    'bg-pink-200 text-pink-700',
    'bg-indigo-200 text-indigo-700',
    'bg-red-200 text-red-700',
    'bg-gray-200 text-gray-700',
  ];
  
  return colors[Math.abs(hash) % colors.length];
};

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
};

const AvatarName: React.FC<AvatarNameProps> = ({ 
  name, 
  size = 'md',
  className = '',
}) => {
  const initials = getInitials(name);
  const colorClass = getRandomColor(name);
  
  return (
    <div 
      className={`rounded-full flex items-center justify-center font-medium ${colorClass} ${sizeClasses[size]} ${className}`}
    >
      {initials}
    </div>
  );
};

export default AvatarName;
