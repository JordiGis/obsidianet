import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-notion-sidebar px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="text-3xl mb-2">🗄️</div>
          <h1 className="text-xl font-semibold text-notion-text">obsidianet · admin</h1>
          <p className="text-sm text-notion-muted mt-1">Panel de administración</p>
        </div>
        <div className="bg-white border border-notion-border rounded-xl p-6 shadow-sm">
          <LoginForm />
        </div>
        <p className="text-center text-xs text-notion-muted mt-6">
          Separate from the notes app login.
        </p>
      </div>
    </div>
  );
}
