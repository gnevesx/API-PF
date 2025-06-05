/** @type {import('tailwindcss').Config} */
module.exports = {
  // O array 'content' é crucial! Ele informa ao Tailwind onde procurar classes.
  // Certifique-se de que todos os arquivos que usam classes Tailwind (diretamente no HTML/JSX
  // ou através de @apply no CSS) estejam incluídos aqui.
  content: [
    // Caminhos para arquivos de componentes, páginas, etc.
    "./app/**/*.{js,ts,jsx,tsx,mdx}",        // Para a pasta 'app' do Next.js 13+
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",      // Para a pasta 'pages' (se ainda usar ou em projetos mais antigos)
    "./components/**/*.{js,ts,jsx,tsx,mdx}", // Para componentes reutilizáveis
    "./src/**/*.{js,ts,jsx,tsx,mdx}",        // Um caminho genérico para qualquer coisa dentro de 'src'

    // *** ESTA É A LINHA CRÍTICA PARA O SEU PROBLEMA ***
    // Ela garante que o Tailwind escaneie seu arquivo CSS global (globals.css)
    // para classes usadas com @apply e as inclua no build.
    "./src/app/globals.css",
  ],
  theme: {
    extend: {
      // Aqui você pode estender o tema padrão do Tailwind.
      // Por exemplo, adicionando cores personalizadas, tamanhos, fontes, etc.
      colors: {
        // Cores personalizadas (opcional):
        primary: {
          50: '#eef2ff', 100: '#e0e7ff', 200: '#c7d2fe', 300: '#a5b4fc', 400: '#818cf8',
          500: '#6366f1', 600: '#4f46e5', 700: '#4338ca', 800: '#3730a3', 900: '#312e81',
          950: '#1e1b4b'
        },
        secondary: {
          50: '#f0f9ff', 100: '#e0f2fe', 200: '#bae6fd', 300: '#7dd3fc', 400: '#38bdf8',
          500: '#0ea5e9', 600: '#0284c7', 700: '#0369a1', 800: '#075985', 900: '#0c4a6e',
          950: '#082f49'
        },
        accent: {
          50: '#fff7ed', 100: '#ffedd5', 200: '#fed7aa', 300: '#fdba74', 400: '#fb923c',
          500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412', 900: '#7c2d12',
          950: '#431407'
        }
      },
      // Exemplo de como adicionar uma nova fonte (se você já tiver configurado no CSS)
      // fontFamily: {
      //   inter: ['Inter', 'sans-serif'],
      // },
      // Exemplo de como adicionar um novo breakpoint (tamanho de tela)
      // screens: {
      //   '3xl': '1600px',
      // },
    },
  },
  plugins: [
    // Aqui você adicionaria plugins do Tailwind CSS, se estiver usando algum.
    // Ex: require('@tailwindcss/forms'), require('@tailwindcss/typography'), etc.
  ],

  // Se você estiver usando o modo escuro manual ou baseado em classe
  // darkMode: 'media', // Padrão: baseado nas configurações do sistema operacional do usuário
  // darkMode: 'class', // Permite alternar o modo escuro com uma classe 'dark' no elemento pai
};