export default async function TestPage({ params }: { params: Promise<{ id: string, type: string }> }) {
  const { id, type } = await params;
  return (
    <div className="p-20 text-white">
      <h1>Test Pagina</h1>
      <p>ID: {id}</p>
      <p>Type: {type}</p>
    </div>
  );
}