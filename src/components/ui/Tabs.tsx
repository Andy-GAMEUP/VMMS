import { clsx } from 'clsx';

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: string) => void;
}

export function Tabs({ tabs, activeKey, onChange }: TabsProps) {
  return (
    <div className="flex border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={clsx(
            'flex-1 py-3 text-center text-title relative touch-target transition-colors',
            activeKey === tab.key
              ? 'text-primary-500 after:absolute after:bottom-0 after:left-1/4 after:right-1/4 after:h-0.5 after:bg-primary-500 after:rounded-full'
              : 'text-gray-400',
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-1 text-caption text-gray-400">{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
