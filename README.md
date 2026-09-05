# RecoverAI

**AI-powered revenue recovery for failed payments**

[Live Demo](https://recoverai-frontend-uf6l.onrender.com/) | [GitHub Repository](https://github.com/Vanshita-27/RecoverAI)

---

## 🎯 Buildathon Context

**Razorpay AI Buildathon 2026 – Track 3: AI Revenue Recovery**

RecoverAI demonstrates how a merchant can identify failed-payment recovery opportunities, prioritize them, generate safe personalized recovery messages, and simulate the complete recovery workflow from a single dashboard.

---

## 📦 Problem Statement

Failed payments directly impact merchant revenue.

Payments can fail because of:

- Insufficient funds
- Network failures
- Expired cards
- Temporary payment issues
- Other retryable payment failures

Traditional recovery processes are often manual, generic, and difficult to prioritize.

A merchant needs to know:

- Which failed payment should be followed up first?
- Which customers are most likely to recover?
- What action should be taken?
- Which communication channel should be used?
- What message should be sent?
- How much revenue can potentially be recovered?

RecoverAI addresses these questions through an AI-assisted revenue recovery workflow.

---

## 💡 Solution Overview

RecoverAI provides a single-page recovery dashboard that:

1. Lists failed payments as **Recovery Opportunities**.
2. Calculates a recovery probability and priority score.
3. Recommends the next recovery action and communication channel.
4. Generates a personalized customer recovery message.
5. Applies safety rules to generated messages.
6. Simulates message dispatch and payment retry.
7. Simulates successful payment recovery.
8. Updates recovered revenue and recovery-rate metrics.

The system combines a **deterministic recovery engine** with an **optional LLM-compatible AI layer**.

---

## 🚀 Key Features

### Recovery Opportunity Detection

Failed payments are converted into actionable recovery opportunities.

Each opportunity can include:

- Customer information
- Payment amount
- Failure reason
- Recovery probability
- Priority score
- Recommended action
- Recommended communication channel

### AI-Assisted Analysis

The AI layer can enrich recovery analysis and generate personalized messages.

The application is designed so that the AI layer is optional.

If an external LLM is unavailable or quota is exhausted, the system can fall back to deterministic logic and predefined templates.

### Smart Prioritization

Recovery opportunities can be prioritized using signals such as:

- Payment value
- Customer information
- Failure reason
- Recovery likelihood
- Recovery opportunity characteristics

This helps merchants focus their attention on higher-value recovery opportunities first.

### Personalized Recovery Messages

RecoverAI generates customer-facing recovery messages based on the available payment and customer context.

The generated message is designed to be:

- Concise
- Action-oriented
- Personalized
- Safe
- Suitable for recovery communication

### Recovery Simulation

The application provides a complete simulated recovery workflow:

**Failed Payment → Recovery Opportunity → Message Generation → Recovery Action → Retry → Successful Recovery → Updated Metrics**

All payment recovery and communication actions in the demo are simulations.

### Analytics Dashboard

The dashboard provides recovery-related metrics such as:

- Failed payments
- Total failed revenue
- Recovered revenue
- Recovery rate
- Recovery opportunities
- Recovery activity

---

## 🔄 Demo Flow

The recommended demo flow is:

### 1. Generate Message

Select a recovery opportunity and generate a personalized recovery message.

### 2. Recover Now

Click **Recover Now**.

This simulates dispatching the recovery message.

> This action does **not** automatically mark the payment as successful.

### 3. Simulate Successful Retry

Click **Simulate Successful Retry**.

This simulates the customer successfully retrying the payment and marks the simulated payment recovery as successful.

### 4. Return to Dashboard

Return to the dashboard.

The recovered revenue and recovery rate are updated based on the simulated successful recovery.

---

## 🧠 AI + Recovery Pipeline

```text
                    Failed Payment
                          │
                          ▼
               Recovery Opportunity
                          │
                          ▼
                Recovery Analysis
                          │
             ┌────────────┴────────────┐
             │                         │
             ▼                         ▼
     Deterministic Engine        Optional AI Layer
             │                         │
             └────────────┬────────────┘
                          ▼
                 Recovery Decision
                          │
                          ▼
                Message Generation
                          │
                          ▼
                   Safety Checks
                          │
                          ▼
                 Recover Now
                          │
                          ▼
              Simulated Message Sent
                          │
                          ▼
             Simulate Successful Retry
                          │
                          ▼
              Payment Marked Recovered
                          │
                          ▼
                 Updated Analytics
