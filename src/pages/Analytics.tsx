import { ResponsiveLayout } from "@/components/layout/ResponsiveLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart3, TrendingUp, Users, FileText, Clock, CheckCircle2, XCircle, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRealTimeDocuments } from "@/hooks/useRealTimeDocuments";
import { useState, useEffect } from "react";

export default function Analytics() {
  const { user } = useAuth();
  const { trackDocuments, approvalCards, isConnected } = useRealTimeDocuments();

  const [metrics, setMetrics] = useState({
    totalDocuments: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    avgProcessingTime: 0,
    todayDocuments: 0,
    activeSessions: 0
  });


  useEffect(() => {
    const allDocs = [...trackDocuments, ...approvalCards];
    const approved = allDocs.filter(d => d.status === 'approved').length;
    const rejected = allDocs.filter(d => d.status === 'rejected').length;
    const pending = allDocs.filter(d => d.status === 'pending').length;

    const today = new Date().toDateString();
    const todayDocs = allDocs.filter(d => new Date(d.submittedDate || '').toDateString() === today).length;

    setMetrics({
      totalDocuments: allDocs.length,
      approved,
      rejected,
      pending,
      avgProcessingTime: 2.2,
      todayDocuments: todayDocs,
      activeSessions: allDocs.filter(d => d.status === 'pending').length
    });
  }, [trackDocuments, approvalCards]);


  useEffect(() => {
    const handleUpdate = () => {
      const allDocs = [...trackDocuments, ...approvalCards];
      const approved = allDocs.filter(d => d.status === 'approved').length;
      const rejected = allDocs.filter(d => d.status === 'rejected').length;
      const pending = allDocs.filter(d => d.status === 'pending').length;

      setMetrics(prev => ({
        ...prev,
        totalDocuments: allDocs.length,
        approved,
        rejected,
        pending
      }));
    };

    window.addEventListener('document-submitted', handleUpdate);
    window.addEventListener('document-approved', handleUpdate);
    window.addEventListener('document-rejected', handleUpdate);
    window.addEventListener('workflow-updated', handleUpdate);

    return () => {
      window.removeEventListener('document-submitted', handleUpdate);
      window.removeEventListener('document-approved', handleUpdate);
      window.removeEventListener('document-rejected', handleUpdate);
      window.removeEventListener('workflow-updated', handleUpdate);
    };
  }, [trackDocuments, approvalCards]);

  if (!user) return null;

  const departmentStats = (user.role === 'principal' || user.role === 'demo-work') ? [
    { name: "Computer Science", submitted: 45, approved: 38, rejected: 7, pending: 0 },
    { name: "Electrical Engineering", submitted: 32, approved: 28, rejected: 2, pending: 2 },
    { name: "Mechanical Engineering", submitted: 28, approved: 24, rejected: 3, pending: 1 },
    { name: "Electronics & Communication", submitted: 35, approved: 30, rejected: 4, pending: 1 },
    { name: "Civil Engineering", submitted: 22, approved: 20, rejected: 1, pending: 1 }
  ] : [];

  const monthlyTrends = (user.role === 'principal' || user.role === 'demo-work') ? [
    { month: "Oct", documents: 120, approved: 98, rejected: 15, avgTime: 2.3 },
    { month: "Nov", documents: 135, approved: 115, rejected: 12, avgTime: 2.1 },
    { month: "Dec", documents: 98, approved: 85, rejected: 8, avgTime: 1.9 },
    { month: "Jan", documents: metrics.totalDocuments || 162, approved: metrics.approved || 140, rejected: metrics.rejected || 17, avgTime: metrics.avgProcessingTime || 2.2 }
  ] : [];

  return (
    <ResponsiveLayout>
      <div className="container mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
        <div className="flex flex-col gap-2 mb-2 sm:mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Comprehensive insights into document workflow performance</p>
        </div>

        {(user.role === 'principal' || user.role === 'demo-work') && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <Card className="shadow-sm border-muted/20">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-primary/10 rounded-lg shrink-0">
                    <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-lg sm:text-2xl font-bold truncate">{metrics.totalDocuments}</p>
                      {isConnected && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" title="Live"></div>}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Total Documents</p>
                    <div className="flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3 text-success" />
                      <span className="text-[10px] sm:text-xs text-success font-medium">Live Updates</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-muted/20">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-success/10 rounded-lg shrink-0">
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-lg sm:text-2xl font-bold truncate">{metrics.approved}</p>
                      {isConnected && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" title="Live"></div>}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Approved</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">{metrics.totalDocuments > 0 ? ((metrics.approved / metrics.totalDocuments) * 100).toFixed(1) : 0}% rate</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-muted/20">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-warning/10 rounded-lg shrink-0">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-warning" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-lg sm:text-2xl font-bold truncate">{user.role === 'demo-work' ? metrics.avgProcessingTime : 0}</p>
                      {isConnected && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" title="Live"></div>}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Avg. Days</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">Processing time</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-muted/20">
              <CardContent className="p-3 sm:p-6">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-destructive/10 rounded-lg shrink-0">
                    <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-lg sm:text-2xl font-bold truncate">{metrics.rejected}</p>
                      {isConnected && <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" title="Live"></div>}
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">Rejected</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">{metrics.totalDocuments > 0 ? ((metrics.rejected / metrics.totalDocuments) * 100).toFixed(1) : 0}% rate</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex w-full overflow-x-auto overflow-y-hidden hide-scrollbar justify-start xs:justify-center sm:grid sm:grid-cols-4 h-auto p-1.5 bg-muted/30 backdrop-blur-md border border-muted/20 rounded-xl gap-1 shadow-sm">
            <TabsTrigger
              value="overview"
              className="flex-shrink-0 xs:flex-1 py-2.5 px-4 rounded-lg transition-all duration-300 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-elegant font-semibold text-sm"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="departments"
              className="flex-shrink-0 xs:flex-1 py-2.5 px-4 rounded-lg transition-all duration-300 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-elegant font-semibold text-sm"
            >
              Departments
            </TabsTrigger>
            <TabsTrigger
              value="trends"
              className="flex-shrink-0 xs:flex-1 py-2.5 px-4 rounded-lg transition-all duration-300 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-elegant font-semibold text-sm"
            >
              Trends
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="flex-shrink-0 xs:flex-1 py-2.5 px-4 rounded-lg transition-all duration-300 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-elegant font-semibold text-sm"
            >
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Document Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm">Approved</span>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <div className="w-16 xs:w-24 sm:w-32 bg-muted rounded-full h-2 overflow-hidden">
                          <div className="bg-success h-2 rounded-full" style={{ width: "86.4%" }}></div>
                        </div>
                        <span className="text-sm font-medium whitespace-nowrap">86.4%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm">Rejected</span>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <div className="w-16 xs:w-24 sm:w-32 bg-muted rounded-full h-2 overflow-hidden">
                          <div className="bg-destructive h-2 rounded-full" style={{ width: "10.5%" }}></div>
                        </div>
                        <span className="text-sm font-medium whitespace-nowrap">10.5%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm">Pending</span>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <div className="w-16 xs:w-24 sm:w-32 bg-muted rounded-full h-2 overflow-hidden">
                          <div className="bg-warning h-2 rounded-full" style={{ width: "3.1%" }}></div>
                        </div>
                        <span className="text-sm font-medium whitespace-nowrap">3.1%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Top Performers
                  </CardTitle>
                  <CardDescription>Departments with best approval rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {departmentStats.slice(0, 3).map((dept, index) => (
                      <div key={dept.name} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant="outline" className="hidden xs:inline-flex shrink-0">#{index + 1}</Badge>
                          <span className="text-sm truncate">{dept.name}</span>
                        </div>
                        <span className="text-sm font-semibold shrink-0">
                          {((dept.approved / dept.submitted) * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="departments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Department-wise Analytics</CardTitle>
                <CardDescription>Document submission and approval statistics by department</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departmentStats.map((dept) => (
                    <div key={dept.name} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{dept.name}</h3>
                        <Badge variant="outline">{dept.submitted} total</Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          <span>{dept.approved} approved</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-destructive" />
                          <span>{dept.rejected} rejected</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-warning" />
                          <span>{dept.pending} pending</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-success h-2 rounded-full"
                            style={{ width: `${(dept.approved / dept.submitted) * 100}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {((dept.approved / dept.submitted) * 100).toFixed(1)}% approval rate
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            {/* Today's Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today's Trends
                </CardTitle>
                <CardDescription>Real-time activity for today ({new Date().toLocaleDateString()})</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 border rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">Documents Today</h4>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0"></div>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">{metrics.todayDocuments}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{metrics.approved} approved, {metrics.pending} pending</p>
                  </div>
                  <div className="p-3 sm:p-4 border rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">Active Sessions</h4>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shrink-0"></div>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">{metrics.activeSessions}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Currently pending</p>
                  </div>
                  <div className="p-3 sm:p-4 border rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">Completed Tasks</h4>
                      <div className="w-2 h-2 bg-green-500 rounded-full shrink-0"></div>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">15</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Tasks finished today</p>
                  </div>
                  <div className="p-3 sm:p-4 border rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs sm:text-sm font-medium text-muted-foreground">System Uptime</h4>
                      <div className="w-2 h-2 bg-green-500 rounded-full shrink-0"></div>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold">99.8%</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Operational status</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Weekly Trends
                </CardTitle>
                <CardDescription>Current week vs previous week comparison</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Documents Processed</h4>
                      <Badge variant="secondary" className="text-green-600 bg-green-50">
                        ↑ 15%
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold">47</p>
                    <p className="text-xs text-muted-foreground">vs 41 last week</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Meetings Scheduled</h4>
                      <Badge variant="secondary" className="text-green-600 bg-green-50">
                        ↑ 8%
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold">23</p>
                    <p className="text-xs text-muted-foreground">vs 21 last week</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Signatures Completed</h4>
                      <Badge variant="secondary" className="text-red-600 bg-red-50">
                        ↓ 5%
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-xs text-muted-foreground">vs 13 last week</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Active Users</h4>
                      <Badge variant="secondary" className="text-green-600 bg-green-50">
                        ↑ 12%
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold">156</p>
                    <p className="text-xs text-muted-foreground">vs 139 last week</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Monthly Trends
                </CardTitle>
                <CardDescription>Document submission and processing trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyTrends.map((month) => (
                    <div key={month.month} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{month.month} 2024</h3>
                        <Badge variant="outline">{month.documents} documents</Badge>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-2 gap-y-3 sm:gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Approved</p>
                          <p className="font-medium">{month.approved}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Rejected</p>
                          <p className="font-medium">{month.rejected}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Avg. Processing</p>
                          <p className="font-medium">{user.role === 'demo-work' ? month.avgTime : 0} days</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Success Rate</p>
                          <p className="font-medium">{((month.approved / month.documents) * 100).toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card className="shadow-sm border-muted/20">
              <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl">System Performance Metrics</CardTitle>
                <CardDescription className="text-sm">Key performance indicators for workflow efficiency</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                  <div className="space-y-4">
                    <h4 className="font-semibold">Processing Times</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Average Processing Time</span>
                        <span className="font-medium">{user.role === 'demo-work' ? "2.2 days" : "0 days"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Fastest Approval</span>
                        <span className="font-medium">4 hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Longest Processing</span>
                        <span className="font-medium">7 days</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-semibold">Quality Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">First-time Approval Rate</span>
                        <span className="font-medium">78.5%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Resubmission Rate</span>
                        <span className="font-medium">12.3%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">User Satisfaction</span>
                        <span className="font-medium">4.6/5.0</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ResponsiveLayout>
  );
}