export const SkeletonCard = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="h-8 w-8 bg-gray-300 dark:bg-gray-700 rounded"></div>
        <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>
      <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
      <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
    </div>
  );
};
