export default function AdminPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">TriFusion AI - Admin Panel</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Platform Administration Dashboard
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">User Management</h2>
            <p className="text-muted-foreground">
              Manage platform users and accounts
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Workspace Management</h2>
            <p className="text-muted-foreground">
              Monitor and manage customer workspaces
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Billing & Subscriptions</h2>
            <p className="text-muted-foreground">
              Manage billing and subscription plans
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Analytics</h2>
            <p className="text-muted-foreground">
              View platform analytics and metrics
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
