export default function TestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Test Page</h1>
      <p>Bu sayfa çalışıyorsa, sorun dynamic route'larda.</p>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  );
}
