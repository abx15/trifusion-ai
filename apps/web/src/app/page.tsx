export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">TriFusion AI</h1>
        <p className="text-lg text-muted-foreground mb-8">
          AI-powered Business Workspace
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Workspaces</h2>
            <p className="text-muted-foreground">
              Personal and company workspaces with multi-tenancy
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Projects & Tasks</h2>
            <p className="text-muted-foreground">
              Manage clients, projects, and tasks in one place
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">AI Assistant</h2>
            <p className="text-muted-foreground">
              Get help with summaries, reports, and answers
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Collaboration</h2>
            <p className="text-muted-foreground">
              Team notifications and real-time updates
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
