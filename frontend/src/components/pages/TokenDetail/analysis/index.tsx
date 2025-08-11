import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { type TokenInfo } from '@kunai/shared'
import TokenActivity from './activity'
import { Icon } from '@/lib/icon'
import { Button } from '@/components/ui/button'
import { useAppSelector } from '@/store/hooks'

const TokenAnalysis = ({ token }: { token: TokenInfo }) => {
  const { selectedChain } = useAppSelector(state => state.other)

  return (
    <div className="h-full px-2">
      <Tabs defaultValue="activity" className="h-full flex flex-col gap-0">
        <TabsList className="bg-transparent flex w-full justify-between items-center">
          <div className="flex items-center gap-1">
            <TabsTrigger value="activity" className="flex items-center gap-1 border-none cursor-pointer data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent">
              Activity
            </TabsTrigger>
            <TabsTrigger value="positions" className="flex items-center gap-1 border-none cursor-pointer data-[state=active]:bg-transparent dark:data-[state=active]:bg-transparent">
              Positions
            </TabsTrigger>
          </div>
          <div>
            <Button variant="defaultOutline" className="h-[28px] w-[28px] p-0.5 rounded-sm"
              onClick={() => {
                if (selectedChain === 'eth') {
                  window.open(`https://app.insightx.network/bubblemaps/1/${token.address}`, '_blank')
                } else if (selectedChain === 'sol') {
                  window.open(`https://app.insightx.network/bubblemaps/114/${token.address}`, '_blank')
                }
              }}
            >
              <Icon icon="bubble" className="size-3" />
            </Button>
          </div>
        </TabsList>

        <TabsContent value="activity" className="flex-1 overflow-y-auto">
          <TokenActivity token={token} />
        </TabsContent>

        <TabsContent value="positions" className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle>Positions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Position tracking coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default TokenAnalysis