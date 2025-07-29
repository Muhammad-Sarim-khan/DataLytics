import AppShell from './AppShell';
import AOSInitializer from './components/AOSInitializer';

export const metadata = {
  title: "DataLytics",
  icons: {
    icon: '/datalytics_icon.png?v=2',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AOSInitializer/>
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}