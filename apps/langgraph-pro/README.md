# @langgraph-js/pro

![npm version](https://img.shields.io/npm/v/@langgraph-js/pro)
![license](https://img.shields.io/npm/l/@langgraph-js/pro)

This is an extension library for LangGraph that provides additional convenient features and tools, helping developers build complex AI workflows more easily. It's particularly suitable for building multi-agent collaboration, deep research, task planning, and other complex scenarios.

## Getting Started

### 1. State Management

```typescript
import { createState, createDefaultAnnotation } from '@langgraph-js/pro';

// Create custom state
const PlannerState = createState().build({
  current_plan: createDefaultAnnotation<Plan | null>(() => null),
  title: createDefaultAnnotation<string>(() => ""),
});

// Extend existing state
const ExportState = createState(PlannerState).build({
    description: createDefaultAnnotation<string>(() => "")
})
```

### 2. Swarm Agent

```typescript
import { createSwarm, createHandoffTool } from '@langgraph-js/pro';

// Create coordinator agent
const coordinator_agent = createReactAgent({
    name: "coordinator",
    llm,
    tools: [createHandoffTool({ 
        agentName: "planner", 
        description: "Create plan",
        // it will keep all state sync with Swarm
        updateState: keepAllStateInHandOff 
    })],
    prompt: "",
});

// Create swarm collaboration
const swarm = createSwarm({
    agents: [coordinator, planner, researcher, reporter],
    defaultActiveAgent: "coordinator"
});
```

### 3. Frontend Actions (Tools) Support

```typescript
import { createFeTools, FEToolsState } from '@langgraph-js/pro';

// Define tools
const tools = [
    {
        name: "search",
        description: "Search information",
        parameters: [
            {
                name: "query",
                type: "string",
                description: "Search keywords",
                required: true
            }
        ]
    }
];

// Create state with tools
const State = createState(
    FEToolsState
).build({})

// Use tools in node
const node = (state) => {
    const feTools = createFeTools(state.fe_tools);
    llm.bindTools(feTools)
}
```

### 4. Messages Utils

```typescript
import { getLastHumanMessage, getTextMessageContent } from '@langgraph-js/pro';

// Get last human message
const lastMessage = getLastHumanMessage(state.messages);

// Get message text content
const content = getTextMessageContent(message);
```

## License

This project is licensed under the Apache-2.0 License.
