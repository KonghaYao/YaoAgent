# @langgraph-js/sdk

## Key Features

- [ ] **Generative UI:**
  - [x] Custom Tool Messages
  - [x] Token Counter
  - [x] Stop Graph Progress
  - [x] Interrupt Handing
  - [x] Error Handling
  - [x] Spend Time
    - [x] Spend Time Persistence（must patch langgraph source code）
  - [ ] Duplicate Tool Aggregation
  - [ ] Remove Message Reverse
  - [ ] Custom Reasoning Content
- [x] **Frontend Actions:**
  - [x] Definition of Union Tools
  - [x] Frontend Function As Tool
    - [x] Custom Response Text
    - [ ] No Response Support
  - [x] Human-in-the-Loop Interaction
  - [x] interrupt mode
- [x] MCP Control
  - [x] Switch on frontend
- [ ] **Authorization:**
  - [ ] OAuth2 Support
  - [x] Cookie-Based Authentication
    - override fetch function in langgraph sdk
  - [x] Custom Token Authentication
    - use defaultHeaders
- [x] **Persistence:**
  - [x] Read History from Langgraph
- [ ] **Sub-Generation:**
  - [ ] Suggestions
  - [ ] Chat Title Auto Generation
