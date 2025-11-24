// ============================================
// RESEARCH AGENT - LANGGRAPH MIT CONDITIONAL ROUTING
// ============================================

// 1. IMPORTS
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { StateGraph, Annotation, END } from '@langchain/langgraph';
import { ChatOpenAI } from '@langchain/openai';
import { TavilySearch } from '@langchain/tavily';

//import { Client as AppwriteClient, Databases, ID } from 'node-appwrite';
import { Client as AppwriteClient, Databases, ID, Query } from 'node-appwrite';
//import sdk from 'node-appwrite';
//const { Client: AppwriteClient, Databases, ID, Query } = sdk;

// SYSTEM SETUP LAYER
dotenv.config();

// Set up CORS -> Communication between frontend and backend even when they run on different addresses
const app = express();
app.use(cors());
app.use(express.json());

console.log('🚀 Research Agent mit Conditional Routing startet...');

// Bugfix area
//console.log('🔎 Appwrite Query object:', Query);

// 2. APPWRITE SETUP
const appwriteClient = new AppwriteClient()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(appwriteClient);

console.log('✅ Appwrite Client connected');

// 3. STATE DEFINITION - KOMPLEX!
const StateAnnotation = Annotation.Root({
    // User Query (stores user's questions)
    query: Annotation({
        reducer: (prev, curr) => curr //overwrites old question with new one
    }),

    // Query Analysis Type [technical, news, general]
    analysisType: Annotation({
        reducer: (prev, curr) => curr
    }),

    // Search Results from Tavily (raw)
    searchResults: Annotation({
        reducer: (prev, curr) => curr
    }),

    // Verification Status Yes/No
    isVerified: Annotation({
        reducer: (prev, curr) => curr
    }),

    // Retry Counter (für Loop)
    retryCount: Annotation({
        reducer: (prev, curr) => curr
    }),

    // Messages (Chat)
    messages: Annotation({
        reducer: (prev, curr) => [...prev, ...curr]
    })  // APPEND RESULT ON TOP OF EACH OTHER (AI + HUMAN)
});

console.log('✅ Complex State Definition erstellt (6 Felder)');

// 4. TOOLS SETUP
const tavilyTool = new TavilySearch({
    maxResults: 5,
    apiKey: process.env.TAVILY_API_KEY
});

const model = new ChatOpenAI({
    modelName: 'gpt-4',
    temperature: 0.3,
    openAIApiKey: process.env.OPENAI_API_KEY
});

console.log('✅ Tools erstellt (Tavily + GPT-4)');

// 5. NODE 1: ANALYZE QUERY
async function analyzeNode(state) {
    console.log('📊 Analyze Node läuft...');

    const userQuery = state.query || state.messages[state.messages.length - 1].content;

    // GPT-4 analysiert Query-Type
    const analysisPrompt = `Analysiere diese Recherche-Anfrage:

"${userQuery}"

Kategorisiere als:
- "technical" - Technische/wissenschaftliche Themen
- "news" - Aktuelle News/Events
- "general" - Allgemeine Informationen

Antworte NUR mit einem Wort: technical, news, oder general`;

    const response = await model.invoke([
        { role: 'user', content: analysisPrompt }
    ]);

    const analysisType = response.content.trim().toLowerCase();

    console.log(`✅ Query Type: ${analysisType}`);

    return {
        query: userQuery,
        analysisType: analysisType,
        retryCount: state.retryCount || 0
    };
}

// 6. NODE 2: SEARCH WITH TAVILY
async function searchNode(state) {
    console.log('🔍 Search Node läuft...');

    // Build query based on analysis type
    let searchQuery = state.query;

    if (state.analysisType === 'technical') {
        searchQuery = `${state.query} research papers technical documentation`;
    } else if (state.analysisType === 'news') {
        searchQuery = `${state.query} latest news 2025`;
    }

    console.log(`🔍 Suche: "${searchQuery}"`);

    /*try {
        const results = await tavilyTool.invoke({ query: searchQuery }); // ✅ key fix
        console.log('✅ Tavily results (kurzer Ausschnitt):', JSON.stringify(results).slice(0, 300));
        return { searchResults: results };
    } catch(err) {
        console.error('❌ Tavily error raw:', err);
        // if it’s a Zod error, you often get more detail here:
        console.error('❌ Tavily inner cause:', err?.cause);
        throw err;
    }*/

    //const results = await tavilyTool.invoke(searchQuery); //standard version
    const results = await tavilyTool.invoke({ query: searchQuery }); //Version from documentation

    return {
        searchResults: results
    };
}

// 7. NODE 3: VERIFY RESULTS QUALITY
async function verifyNode(state) {
    console.log('✔️  Verify Node läuft...');

    // GPT-4 prüft ob Ergebnisse gut sind
    const verifyPrompt = `Prüfe diese Suchergebnisse:

Query: "${state.query}"
Results: ${state.searchResults}

Sind die Ergebnisse relevant und ausreichend?

Antworte NUR mit: yes oder no`;

    const response = await model.invoke([
        { role: 'user', content: verifyPrompt }
    ]);

    const isGood = response.content.trim().toLowerCase() === 'yes';

    console.log(`✅ Verification: ${isGood ? 'GOOD' : 'BAD'}`);

    return {
        isVerified: isGood,
        retryCount: state.retryCount + 1
    };
}

// 8. NODE 4: SUMMARIZE & CREATE REPORT
async function summarizeNode(state) {
    console.log('📝 Summarize Node läuft...');

    const summaryPrompt = `Erstelle einen detaillierten Research Report:

Query: "${state.query}"
Type: ${state.analysisType}
Sources: ${state.searchResults}

Format:
## ${state.query}

### Zusammenfassung:
- Punkt 1
- Punkt 2
- Punkt 3

### Details:
[Ausführliche Erklärung]

### Quellen:
1. [URL]
2. [URL]

Sei präzise und strukturiert.`;

    const response = await model.invoke([
        { role: 'user', content: summaryPrompt }
    ]);

    const report = response.content;

    console.log(`✅ Report generiert (${report.length} Zeichen)`);

    return {
        messages: [
            { role: 'assistant', content: report }
        ]
    };
}

// 9. ROUTING LOGIC - DAS IST NEU!
function routeAfterVerify(state) {
    console.log('🔀 Routing Decision...');

    // Max 2 Retries
    if (state.retryCount >= 2) {
        console.log('⚠️  Max retries reached, proceeding to summary');
        return 'summarize';
    }

    // Results good → summarize
    if (state.isVerified) {
        console.log('✅ Results verified, going to summary');
        return 'summarize';
    }

    // Results bad → retry search
    console.log('❌ Results not verified, retrying search');
    return 'search';
}

// 10. GRAPH ERSTELLEN - MIT CONDITIONAL EDGES!
const graph = new StateGraph(StateAnnotation)
    // Nodes hinzufügen
    .addNode('analyze', analyzeNode)
    .addNode('search', searchNode)
    .addNode('verify', verifyNode)
    .addNode('summarize', summarizeNode)

    // Edges definieren
    .addEdge('__start__', 'analyze')      // START → analyze
    .addEdge('analyze', 'search')         // analyze → search
    .addEdge('search', 'verify')          // search → verify

    // CONDITIONAL EDGE - DAS IST DER KEY PART!
    .addConditionalEdges(
        'verify',                           // Von verify Node...
        routeAfterVerify,                   // ...rufe routing function...
        {
            'search': 'search',               // ...entweder zurück zu search
            'summarize': 'summarize'          // ...oder weiter zu summarize
        }
    )

    .addEdge('summarize', END);           // summarize → END

const agent = graph.compile();

console.log('✅ LangGraph Agent mit 4 Nodes + Conditional Routing erstellt');

// 11. HELPER: SAVE TO APPWRITE
async function saveReport(userId, query, analysisType, report) {
    try {
        // Extract URLs from report
        const urlRegex = /(https?:\/\/[^\s\)]+)/g;
        const sources = report.match(urlRegex) || [];

        const document = await databases.createDocument(
            process.env.APPWRITE_DATABASE_ID,
            process.env.APPWRITE_COLLECTION_ID,
            ID.unique(),
            {
                userId: userId,
                query: query,
                analysisType: [analysisType],
                report: report,
                sources: sources,
                timestamp: new Date().toISOString()
            }
        );

        console.log(`✅ Report saved: ${document.$id}`);
        return document;
    } catch (error) {
        console.error('❌ Save error:', error.message);
        throw error;
    }
}

// 12. API ENDPOINTS
// Function allows backend to respond to frontend requests with agent and agent-functions
app.post('/api/research', async (req, res) => {
    try {
        const { userId, query } = req.body;

        if (!userId || !query) {
            return res.status(400).json({ error: 'userId and query required' });
        }

        console.log(`📥 Research request: "${query}"`);

        // Agent ausführen
        const result = await agent.invoke({
            messages: [{ role: 'user', content: query }],
            retryCount: 0
        });

        const report = result.messages[result.messages.length - 1].content;

        // In Appwrite speichern
        await saveReport(userId, result.query, result.analysisType, report);

        res.json({
            success: true,
            query: result.query,
            analysisType: result.analysisType,
            report: report,
            verified: result.isVerified,
            retries: result.retryCount
        });

    } catch (error) {
        console.error('❌ Research error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/reports', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId required' });
        }

        const response = await databases.listDocuments(
            process.env.APPWRITE_DATABASE_ID,
            process.env.APPWRITE_COLLECTION_ID,
            [
                Query.equal('userId', userId),
                Query.orderDesc('timestamp')
            ]
        );
        console.log(`Response before error: "${response}"`)

        res.json({
            success: true,
            reports: response.documents
        });

    } catch (error) {
        console.error('❌ Get reports error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.get('/health', (req, res) => res.json({ status: 'OK' }));

app.listen(3001, () => {
    console.log('✅ Server running on http://localhost:3001');
});