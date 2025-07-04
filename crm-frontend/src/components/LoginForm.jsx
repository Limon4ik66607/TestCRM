import { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, LogIn, Building2, Shield } from 'lucide-react';

const LoginForm = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setIsLoading(true);

    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    try {
      const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Ошибка входа");
      }

      // Simulate loading for better UX
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Вычисляем время истечения токена (если сервер не предоставляет)
      const tokenExpiry = data.expires_in 
        ? Date.now() + (data.expires_in * 1000) 
        : Date.now() + (24 * 60 * 60 * 1000); // 24 часа по умолчанию
      
      onLogin(data.access_token, tokenExpiry);
    } catch (err) {
      setError(err.message || "Неверные учетные данные");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }}></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 py-24">
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">BusinessCRM</h1>
                <p className="text-slate-400 text-sm">Управление бизнесом</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-white leading-tight">
              Управляйте своим бизнесом профессионально
            </h2>
            <p className="text-xl text-slate-300 leading-relaxed">
              Полнофункциональная CRM система для эффективного управления клиентами, продажами и бизнес-процессами.
            </p>
            
            <div className="grid grid-cols-1 gap-4 mt-8">
              <div className="flex items-center text-slate-300">
                <Shield className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" />
                <span>Безопасность корпоративного уровня</span>
              </div>
              <div className="flex items-center text-slate-300">
                <Building2 className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" />
                <span>Масштабируемость для любого бизнеса</span>
              </div>
              <div className="flex items-center text-slate-300">
                <Lock className="w-5 h-5 text-blue-400 mr-3 flex-shrink-0" />
                <span>Защита данных по стандартам GDPR</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">BusinessCRM</h1>
                <p className="text-slate-600 text-sm">Управление бизнесом</p>
              </div>
            </div>
          </div>

          {/* Login form */}
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Вход в систему</h2>
              <p className="text-slate-600">Введите ваши учетные данные для доступа к CRM</p>
            </div>

            <div className="space-y-6"
                 onSubmit={handleLogin}>
              {/* Email field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email адрес
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-slate-900 placeholder-slate-500"
                    placeholder="your@company.com"
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Пароль
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-slate-900 placeholder-slate-500"
                    placeholder="Введите пароль"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                    {error}
                  </div>
                </div>
              )}

              {/* Remember me and forgot password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
                    Запомнить меня
                  </label>
                </div>
                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                    Забыли пароль?
                  </a>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="button"
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Выполняется вход...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Войти в систему
                  </>
                )}
              </button>
            </div>

            {/* Demo credentials */}
            <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600 text-center">
                <span className="font-medium">Демо-доступ:</span> test@example.com / test
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              © 2025 BusinessCRM. Все права защищены.
            </p>
            <div className="flex justify-center space-x-4 mt-2">
              <a href="#" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                Политика конфиденциальности
              </a>
              <a href="#" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                Условия использования
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;