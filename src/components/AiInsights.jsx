const AiInsights = ({ insights }) => {
  if (!insights) return null;

  return (
    <div className="mt-6 bg-gradient-to-r from-blue-50 to-white p-4 rounded-xl shadow-md border border-gray-200">
      <h4 className="font-semibold text-gray-800 mb-2">💡 AI Insights</h4>
      <p className="text-sm text-gray-700 whitespace-pre-line">{insights}</p>
    </div>
  );
};

export default AiInsights;
