import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { PlusIcon } from 'lucide-react'
import { DataTable } from '@/components/table/data-table'
import { columns } from '@/components/table/columns'
import { poolsAPI } from '@/services/api'

const NewPair = () => {
  const [selectedInterval, setSelectedInterval] = useState('1h')

  useEffect(() => {
    // Initial fetch
    const fetchPools = () => {
      poolsAPI.getNewPools().then((res) => {
        console.log(res);
      });
    };

    // Fetch immediately on mount
    fetchPools();

    // // Set up interval to fetch every 30 seconds
    // const interval = setInterval(fetchPools, 30000);

    // // Cleanup interval on unmount
    // return () => clearInterval(interval);
  }, []);

  const intervals = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '1h', label: '1h' },
    { value: '6h', label: '6h' },
    { value: '24h', label: '24h' },
  ]

  return (
    <div>
      <div className="flex gap-4 items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold">New pair</span>
          {/* Time Interval Button Group */}
          <div className="flex items-center gap-1 bg-muted rounded-md">
            {intervals.map((interval) => (
              <Button
                key={interval.value}
                variant={selectedInterval === interval.value ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedInterval(interval.value)}
                className="h-8 px-3 text-xs font-medium"
              >
                {interval.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <PlusIcon className="w-4 h-4" />
            Add pair
          </Button>
        </div>
      </div>
      <div className="px-2">
        <DataTable columns={columns} data={[]} />
      </div>
    </div>
  )
}

export default NewPair