import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { type TokenInfo } from '@kunai/shared'
import TokenActivity from './activity'

const TokenAnalysis = ({ token }: { token: TokenInfo }) => {
  return (
    <div className="h-full p-2">
      <Tabs defaultValue="activity" className="h-full flex flex-col">
        <TabsList className="bg-transparent">
          <TabsTrigger value="activity" className="flex items-center gap-1 border-none">
            Activity
          </TabsTrigger>
          <TabsTrigger value="positions" className="flex items-center gap-1 border-none">
            Positions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="flex-1 overflow-y-auto">
          <TokenActivity />
        </TabsContent>

        <TabsContent value="positions" className="flex-1 mt-4">
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