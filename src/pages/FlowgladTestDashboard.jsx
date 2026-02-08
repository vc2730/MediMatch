import { useState, useEffect } from 'react'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { triggerTestPayment, getUsageEvents } from '../services/flowgladIntegration'
import {
  DollarSign,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  CreditCard,
  TrendingUp,
  AlertCircle
} from 'lucide-react'

const FlowgladTestDashboard = () => {
  const [testPayments, setTestPayments] = useState([])
  const [usageEvents, setUsageEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [triggering, setTriggering] = useState(false)
  const [lastResult, setLastResult] = useState(null)

  // Load usage events on mount
  useEffect(() => {
    loadUsageEvents()
  }, [])

  const loadUsageEvents = async () => {
    setLoading(true)
    const events = await getUsageEvents()
    setUsageEvents(events)
    setLoading(false)
  }

  const handleTestPayment = async (priority = 'standard') => {
    setTriggering(true)
    setLastResult(null)

    const result = await triggerTestPayment({
      priority,
      erRoom: `TEST-ER-${Math.floor(Math.random() * 999 + 1).toString().padStart(3, '0')}`,
      testNote: `Manual test payment triggered at ${new Date().toLocaleTimeString()}`
    })

    setLastResult(result)

    if (result.success) {
      // Add to local test payments list
      setTestPayments(prev => [{
        ...result,
        priority,
        id: result.billingEventId
      }, ...prev])

      // Refresh usage events after a short delay
      setTimeout(() => loadUsageEvents(), 1000)
    }

    setTriggering(false)
  }

  const totalAmount = usageEvents.length
  const testModeEvents = usageEvents.filter(e => e.properties?.testMode).length

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ink-900 dark:text-white flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-green-600" />
            Flowglad Billing Test Dashboard
          </h1>
          <p className="text-ink-500 dark:text-ink-300 mt-2">
            Test unlimited payments with unique transaction IDs • Real API integration
          </p>
        </div>
        <Button onClick={loadUsageEvents} disabled={loading} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-green-700 dark:text-green-300 font-medium">Total Usage Events</div>
              <div className="text-3xl font-bold text-green-900 dark:text-green-100 mt-1">{totalAmount}</div>
            </div>
            <div className="rounded-full bg-green-100 dark:bg-green-900/40 p-3">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-700 dark:text-blue-300 font-medium">Test Mode Events</div>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">{testModeEvents}</div>
            </div>
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/40 p-3">
              <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-purple-700 dark:text-purple-300 font-medium">Recent Tests</div>
              <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-1">{testPayments.length}</div>
            </div>
            <div className="rounded-full bg-purple-100 dark:bg-purple-900/40 p-3">
              <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Test Payment Triggers */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-ink-900 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-600" />
          Trigger Test Payments
        </h2>
        <p className="text-sm text-ink-600 dark:text-ink-300 mb-4">
          Each payment generates a unique transaction ID, allowing unlimited testing
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            onClick={() => handleTestPayment('immediate')}
            disabled={triggering}
            className="bg-red-600 hover:bg-red-700"
          >
            {triggering ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Immediate
          </Button>
          <Button
            onClick={() => handleTestPayment('emergent')}
            disabled={triggering}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {triggering ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Emergent
          </Button>
          <Button
            onClick={() => handleTestPayment('urgent')}
            disabled={triggering}
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            {triggering ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Urgent
          </Button>
          <Button
            onClick={() => handleTestPayment('standard')}
            disabled={triggering}
            variant="default"
          >
            {triggering ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            Standard
          </Button>
        </div>

        {/* Last Result */}
        {lastResult && (
          <div className={`mt-4 p-4 rounded-lg border ${
            lastResult.success
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
              : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
          }`}>
            <div className="flex items-start gap-3">
              {lastResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className={`font-semibold ${lastResult.success ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                  {lastResult.success ? 'Payment Successful!' : 'Payment Failed'}
                </div>
                {lastResult.success && (
                  <div className="text-sm mt-1 space-y-1">
                    <div className="text-green-700 dark:text-green-300">
                      <span className="font-medium">Billing Event ID:</span> {lastResult.billingEventId}
                    </div>
                    <div className="text-green-700 dark:text-green-300">
                      <span className="font-medium">Transaction ID:</span> {lastResult.transactionId}
                    </div>
                    <div className="text-green-700 dark:text-green-300">
                      <span className="font-medium">Amount:</span> {lastResult.amount} unit
                    </div>
                  </div>
                )}
                {!lastResult.success && (
                  <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {lastResult.error}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Recent Test Payments */}
      {testPayments.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-ink-900 dark:text-white mb-4">
            Recent Test Payments ({testPayments.length})
          </h2>
          <div className="space-y-3">
            {testPayments.map((payment, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-ink-50 dark:bg-ink-800/50 border border-ink-200 dark:border-ink-700">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium text-ink-900 dark:text-white">
                      {payment.billingEventId}
                    </div>
                    <div className="text-xs text-ink-500 dark:text-ink-400">
                      {new Date(payment.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className={`
                  ${payment.priority === 'immediate' ? 'bg-red-100 text-red-700 dark:bg-red-900/40' : ''}
                  ${payment.priority === 'emergent' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40' : ''}
                  ${payment.priority === 'urgent' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40' : ''}
                  ${payment.priority === 'standard' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40' : ''}
                `}>
                  {payment.priority}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* All Usage Events */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-ink-900 dark:text-white mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-brand-600" />
          All Usage Events ({usageEvents.length})
        </h2>

        {loading ? (
          <div className="text-center py-8 text-ink-500">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            Loading events...
          </div>
        ) : usageEvents.length === 0 ? (
          <div className="text-center py-8 text-ink-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            No usage events found. Trigger a test payment to get started!
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {usageEvents.map((event, idx) => (
              <div key={idx} className="flex items-start justify-between p-3 rounded-lg border border-ink-200 dark:border-ink-700 hover:bg-ink-50 dark:hover:bg-ink-800/30 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-medium text-ink-900 dark:text-white text-sm">
                      {event.id || 'Event'}
                    </div>
                    {event.properties?.testMode && (
                      <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/40">
                        Test
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-ink-500 dark:text-ink-400 space-y-0.5">
                    <div>Transaction: {event.transactionId}</div>
                    <div>ER Room: {event.properties?.erRoom || 'N/A'}</div>
                    <div>Priority: {event.properties?.patientPriority || 'N/A'}</div>
                    {event.timestamp && (
                      <div>Time: {new Date(event.timestamp).toLocaleString()}</div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-600 dark:text-green-400">
                    {event.amount || 1} unit
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Info Card */}
      <Card className="p-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <div className="font-semibold mb-1">How This Works</div>
            <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
              <li>Each test payment generates a <strong>unique transaction ID</strong> (timestamp + random)</li>
              <li>This allows <strong>unlimited test payments</strong> without duplicates</li>
              <li>Real Flowglad API calls are made to record usage events</li>
              <li>All events are flagged with <code className="px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-900">testMode: true</code></li>
              <li>Usage events appear in your Flowglad dashboard in real-time</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default FlowgladTestDashboard
