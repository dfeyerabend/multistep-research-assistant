// ============================================
// RESEARCH AGENT - FRONTEND
// ============================================

import { useState, useEffect } from 'react';

interface Message {
    role: 'user' | 'ai';
    content: string;
}

interface Report {
    $id: string;
    query: string;
    analysisType: string;
    report: string;
    timestamp: string;
}

function App() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [userId] = useState('user-' + Math.random().toString(36).substr(2, 9));
    const [reports, setReports] = useState<Report[]>([]);
    const [view, setView] = useState<'chat' | 'reports'>('chat');

    useEffect(() => {
        if (view === 'reports') {
            loadReports();
        }
    }, [view]);

    const loadReports = async () => {
        try {
            const res = await fetch(`http://localhost:3001/api/reports?userId=${userId}`);
            const data = await res.json();
            setReports(data.reports || []);
        } catch (error) {
            console.error('Load reports error:', error);
        }
    };

    const startResearch = async () => {
        if (!input.trim() || loading) return;

        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:3001/api/research', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, query: input })
            });

            const data = await res.json();

            const aiMsg: Message = {
                role: 'ai',
                content: `**Analysis Type:** ${data.analysisType}\n**Retries:** ${data.retries}\n\n${data.report}`
            };

            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            const errorMsg: Message = {
                role: 'ai',
                content: 'Error: Backend nicht erreichbar!'
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '30px auto', padding: '20px', fontFamily: 'Arial' }}>
            {/* Navigation */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                    onClick={() => setView('chat')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: view === 'chat' ? '#007bff' : '#ccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    🔍 Research
                </button>
                <button
                    onClick={() => setView('reports')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: view === 'reports' ? '#007bff' : '#ccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    📚 Reports
                </button>
            </div>

            {/* Chat View */}
            {view === 'chat' && (
                <>
                    <h1 style={{ textAlign: 'center' }}>🔬 Multi-Step Research Agent</h1>

                    <div style={{
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        padding: '20px',
                        height: '500px',
                        overflowY: 'auto',
                        marginBottom: '20px',
                        backgroundColor: '#f9f9f9'
                    }}>
                        {messages.map((msg, i) => (
                            <div key={i} style={{
                                marginBottom: '15px',
                                padding: '15px',
                                borderRadius: '8px',
                                backgroundColor: msg.role === 'user' ? '#007bff' : '#ffffff',
                                color: msg.role === 'user' ? 'white' : '#333',
                                whiteSpace: 'pre-wrap'
                            }}>
                                <strong>{msg.role === 'user' ? 'Du' : 'AI Research Agent'}:</strong><br />
                                {msg.content}
                            </div>
                        ))}
                        {loading && (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#007bff' }}>
                                <div>🔄 Researching...</div>
                                <div style={{ fontSize: '12px', marginTop: '10px' }}>
                                    Analyze → Search → Verify → {loading && 'Summarize'}
                                </div>
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && startResearch()}
                            placeholder="z.B. 'LangGraph vs LangChain comparison'"
                            disabled={loading}
                            style={{
                                flex: 1,
                                padding: '15px',
                                fontSize: '14px',
                                borderRadius: '8px',
                                border: '1px solid #ddd'
                            }}
                        />
                        <button
                            onClick={startResearch}
                            disabled={loading || !input.trim()}
                            style={{
                                padding: '15px 30px',
                                backgroundColor: (loading || !input.trim()) ? '#ccc' : '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Research
                        </button>
                    </div>
                </>
            )}

            {/* Reports View */}
            {view === 'reports' && (
                <>
                    <h1 style={{ textAlign: 'center' }}>📚 Saved Reports</h1>

                    {reports.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                            Noch keine Reports gespeichert.
                        </div>
                    )}

                    {reports.map((report) => (
                        <div key={report.$id} style={{
                            backgroundColor: '#ffffff',
                            padding: '20px',
                            marginBottom: '20px',
                            borderRadius: '10px',
                            border: '1px solid #ddd'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0' }}>{report.query}</h3>
                            <div style={{
                                fontSize: '12px',
                                color: '#666',
                                marginBottom: '15px'
                            }}>
                                Type: {report.analysisType} | {new Date(report.timestamp).toLocaleString('de-DE')}
                            </div>
                            <div style={{
                                whiteSpace: 'pre-wrap',
                                lineHeight: '1.6',
                                color: '#333'
                            }}>
                                {report.report}
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}

export default App;