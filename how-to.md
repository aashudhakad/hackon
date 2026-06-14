Here is the Product Requirements Document (PRD) focusing strictly on the required features and user experience components.

---

# Product Requirements Document: Amazon Instant Engine

### **Brief Tech Stack Overview**

* **Target Platform:** Mobile-First Responsive Web App
* **Frontend:** Next.js (React) + Tailwind CSS
* **Backend:** Node.js (Express)
* **Database:** MongoDB
* **AI Integration:** Multi-modal LLM API (Vision + Text processing)

---

## 1. Feature 0: The Home Page (The Intent Hub)

**What it is:** The central launchpad that replaces traditional e-commerce search bars. It acts as a command center for intent-driven shopping.

**What we need to make:**

* **The Intent Bar:** A prominent, oversized text input field that asks, "What are you trying to do?" rather than "What are you looking for?" It should feature cycling placeholder text (e.g., *"Make breakfast"*, *"Recover from illness"*).
* **The Snap Icon:** A distinct camera/scan icon embedded directly inside or next to the Intent Bar.
* **Smart Bundles Grid (Life Moments):** A visual grid of 4–6 highly engaging, pill-shaped buttons or cards for frequent, urgent situations.
* *Required content examples:* "Host a guest in 10 mins", "Office emergency kit", "Movie night pack".
* *Routing requirement:* Tapping these must instantly bypass AI generation and load a pre-assembled Feature 3 (3-Tier Basket).



---

## 2. Feature 1: Snap & Order (Vision-to-Cart)

**What it is:** A camera-first workflow that allows users to build a cart simply by taking a picture of what they need to restock or create.

**What we need to make:**

* **Camera Integration:** An interface element (triggered from the Home Page Snap Icon) that opens the user's native mobile camera or file picker.
* **Processing UI:** A clear, engaging loading state (e.g., "Analyzing your recipe..." or "Scanning pantry...") while the image is being processed.
* **Seamless Handoff:** Once the image is processed into a text intent, the application must automatically transition the user directly into the Feature 2 (Category Grid) interface, pre-populated with the required items.

---

## 3. Feature 2: Goal-Oriented Category Grid (Normal Quick Mode)

**What it is:** The primary interface for text-based intents. It organizes products by the *components required* for the goal, rather than just listing isolated items.

**What we need to make:**

* **Vertical Category Rows:** A top-to-bottom layout where each row represents a mandatory component of the user's intent (e.g., if the intent is "Bake a cake", Row 1 is Flour, Row 2 is Sugar, Row 3 is Eggs).
* **Horizontal Brand Swiper:** Inside every vertical category row, a horizontally scrollable list of competing brands or variations (e.g., scrolling right on the "Butter" row shows Amul, Mother Dairy, etc.).
* **Active Selection State:** Clear visual feedback indicating exactly which product in the horizontal swiper is currently selected to go into the final cart.

---

## 4. Feature 3: Super Quick Mode (3-Tier Baskets)

**What it is:** The ultimate frictionless checkout experience. It presents users with fully assembled, non-customizable (or minimally customizable) baskets based on their budget.

**What we need to make:**

* **3-Tab Navigation:** A prominent switcher at the top of the screen allowing the user to toggle between three distinct price tiers: **Budget**, **Balanced**, and **Premium**.
* *Default State:* The UI must always load with the "Balanced" (Mid) tier selected by default.


* **Dynamic Cart Summary:** A clear visual list of the items contained in the currently active tier, along with the total basket price. Toggling the tabs must instantly update the list and the total price.
* **1-Click Checkout Button:** A persistent, sticky button anchored to the bottom of the screen that immediately finalizes the purchase of the currently active basket.

---

## 5. Feature 4: Contextual Cross-Sell ("Also Looking For")

**What it is:** A recommendation engine to increase cart size without interrupting the user's primary goal.

**What we need to make:**

* **Persistent Bottom Tab:** A horizontal carousel pinned near the bottom of the screen in Mode 1 (Snap & Order) and Mode 2 (Category Grid).
* **Thematic Recommendations:** A visual strip of 3–4 individual products that are highly relevant to the overall theme of the generated basket, allowing users to add an item with a single tap. (e.g., Suggesting paper plates if the core basket is "Birthday Party Supplies").