const TESTFLIGHT_URL = process.env.TESTFLIGHT_URL!;

export default function NotFound() {
  return (
    <main style={styles.main}>
      <h1 style={styles.title}>Clip Not Found</h1>
      <p style={styles.text}>This clip may have been deleted or the link is invalid.</p>
      <a href={TESTFLIGHT_URL} style={styles.button}>
        Get Spindrift on iOS
      </a>
    </main>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  main: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    textAlign: 'center',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    marginBottom: '16px',
  },
  text: {
    color: '#888',
    marginBottom: '32px',
  },
  button: {
    padding: '12px 32px',
    backgroundColor: '#0066CC',
    color: '#fff',
    borderRadius: '8px',
    fontWeight: '600',
    textDecoration: 'none',
  },
};
