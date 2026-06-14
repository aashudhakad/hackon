# Requirements Document

## IntroductionV

Amazon Instant Engine is a mobile-first responsive web application that replaces traditional search-first shopping with intent-first shopping. Instead of asking "What are you looking for?", the application asks "What are you trying to do?" and translates a user's expressed outcome (via free text, spoken voice, an uploaded image, or a pre-made Smart Bundle) into a complete, purchasable shopping bundle within seconds.

The product targets quick-commerce users, impulse buyers, and time-poor professionals with immediate situational needs. The core value is extreme low-friction shopping: users express an intent, instantly receive a useful and trustworthy bundle, refine it with minimal effort, and check out quickly. The experience is outcome-based rather than product-based.

This document defines the requirements for the 48-hour hackathon MVP across five core features (Intent Hub, Snap & Order, Goal-Oriented Category Grid, Super Quick Mode 3-Tier Basket, Contextual Cross-Sell) plus cross-cutting concerns (intent understanding, bundle generation and ranking, performance, trust and explainability, error and unavailable-item handling, and checkout). The architecture should remain capable of scaling into a real product.

The target technology stack is Next.js + React + Tailwind CSS (frontend), Node.js + Express (backend), MongoDB Atlas (database), Redis (cache and session), and a multi-modal LLM API for text and vision intent understanding.

## Glossary

- **Instant_Engine**: The complete Amazon Instant Engine system, encompassing frontend, backend, and AI integration.
- **Intent_Hub**: The home page that serves as the launchpad for intent-driven shopping, containing the Intent_Bar, Snap_Icon, and Smart_Bundles_Grid.
- **Intent_Bar**: The oversized text input field on the Intent_Hub that accepts a natural-language outcome from the user.
- **Snap_Icon**: The camera/scan control embedded in or next to the Intent_Bar that initiates the Vision_to_Cart workflow.
- **Mic_Button**: The microphone control displayed inside or directly adjacent to the Intent_Bar that initiates the Voice_Capture workflow.
- **Voice_Capture**: The workflow that records a user's spoken shopping intent and converts it into editable Intent_Bar text.
- **Audio_Clip**: The audio recording captured during Voice_Capture, bounded by a maximum duration and a maximum file size.
- **Client_Speech_Recognizer**: The browser-provided speech-to-text capability (for example, the Web Speech API) that transcribes an Audio_Clip into text on the frontend.
- **Audio_Intent_Processor**: The backend subsystem that receives an uploaded Audio_Clip through a dedicated audio endpoint and forwards it to the multi-modal LLM API to derive the shopping intent directly from the audio.
- **Recognized_Intent_Text**: The text produced by the Client_Speech_Recognizer or the Audio_Intent_Processor that represents the user's spoken shopping intent.
- **Smart_Bundle**: A pre-assembled, ready-made bundle for a frequent or urgent situation that loads without invoking AI generation.
- **Smart_Bundles_Grid**: The visual grid of 4 to 6 Smart_Bundle cards displayed on the Intent_Hub.
- **Vision_Processor**: The subsystem that converts an uploaded image into a structured shopping intent using the multi-modal LLM API.
- **Intent_Parser**: The subsystem that converts a natural-language intent (typed text or vision-derived text) into a structured dependency representation of required components.
- **Bundle_Generator**: The subsystem that produces a complete shopping bundle from a structured intent, including item selection and ranking.
- **Category_Grid**: The goal-oriented interface that organizes products into vertical rows by required component, each containing a horizontal swiper of product alternatives.
- **Category_Row**: A single vertical row in the Category_Grid representing one mandatory component of the user's goal.
- **Brand_Swiper**: The horizontally scrollable list of competing products or brands within a Category_Row.
- **Selected_Item**: The product currently chosen within a Category_Row or basket to be included in the cart.
- **Super_Quick_Mode**: The 3-tier basket interface presenting Budget, Balanced, and Premium ready-made baskets.
- **Basket_Tier**: One of the three price tiers (Budget, Balanced, Premium) in Super_Quick_Mode.
- **Cart_Summary**: The visible list of items and the total price for the currently active basket or selection.
- **Checkout_Button**: The persistent, sticky control that finalizes the purchase of the currently active basket.
- **Cross_Sell_Strip**: The bottom carousel of 3 to 4 thematic recommended products shown in shopping modes.
- **Catalog**: The product inventory data store containing products, prices, availability, and brand information.
- **Confidence_Score**: A numeric measure (0 to 100) produced by the Bundle_Generator indicating how well a generated bundle matches the expressed intent.

## Requirements

### Requirement 1: Intent Hub Home Page

**User Story:** As a shopper, I want a home page centered on what I am trying to do, so that I can express an outcome instead of searching for individual products.

#### Acceptance Criteria

1. WHEN the Intent_Hub loads, THE Instant_Engine SHALL display the Intent_Bar with the prompt text "What are you trying to do?"
2. WHILE the Intent_Bar is empty and unfocused, THE Instant_Engine SHALL cycle through at least 3 placeholder example phrases, advancing to the next phrase every 3 seconds.
3. THE Instant_Engine SHALL display the Snap_Icon inside or directly adjacent to the Intent_Bar.
4. WHERE between 4 and 6 Smart_Bundle cards are available, THE Instant_Engine SHALL display all available Smart_Bundle cards in the Smart_Bundles_Grid.
5. WHERE more than 6 Smart_Bundle cards are available, THE Instant_Engine SHALL display exactly 6 Smart_Bundle cards and SHALL hide the remaining cards.
6. WHERE fewer than 4 Smart_Bundle cards are available, THE Instant_Engine SHALL display all available Smart_Bundle cards in the Smart_Bundles_Grid.
7. WHEN the viewport width is 480 pixels or less, THE Instant_Engine SHALL render the Intent_Hub in a single-column mobile-first layout with the Intent_Bar and Smart_Bundles_Grid fully visible without horizontal scrolling.
8. WHILE the Intent_Bar contains only empty or whitespace-only text, THE Instant_Engine SHALL disable the intent submit action.
9. THE Instant_Engine SHALL limit Intent_Bar input to a maximum of 200 characters.
10. WHEN the user submits text in the Intent_Bar, THE Instant_Engine SHALL trim leading and trailing whitespace from the text before processing the intent.
11. WHEN the user submits non-empty text in the Intent_Bar, THE Instant_Engine SHALL route the user to the Category_Grid experience for the submitted intent within 2 seconds.
12. IF routing to the Category_Grid fails after an intent submission, THEN THE Instant_Engine SHALL retain the submitted text in the Intent_Bar and SHALL display an error indication that the intent could not be processed.

### Requirement 2: Smart Bundle Quick Actions

**User Story:** As a shopper with an urgent need, I want one-tap pre-made bundles, so that I can reach a ready basket instantly without describing my intent.

#### Acceptance Criteria

1. THE Instant_Engine SHALL display each Smart_Bundle card with a non-empty text label, of at most 60 characters, that names its situation.
2. WHEN the user taps a Smart_Bundle card, THE Instant_Engine SHALL load the corresponding pre-assembled Super_Quick_Mode 3-tier basket without invoking the Bundle_Generator free-text generation flow.
3. WHILE a Smart_Bundle is being processed, from the moment the user taps the card until the basket is displayed, THE Instant_Engine SHALL block the Bundle_Generator from running through any other trigger.
4. WHEN the user taps a Smart_Bundle card, THE Instant_Engine SHALL display the resulting Super_Quick_Mode basket within 1 second.
5. WHEN a Smart_Bundle 3-tier basket is displayed, THE Instant_Engine SHALL set the Balanced Basket_Tier as active with a visually selected state distinct from the Budget and Premium tiers.
6. IF a pre-assembled Smart_Bundle basket fails to load, THEN THE Instant_Engine SHALL remain on the Intent_Hub, SHALL display an error message indicating the basket could not be loaded, and SHALL offer the user the option to retry.

### Requirement 3: Snap and Order Vision-to-Cart

**User Story:** As a shopper, I want to take or upload a photo of what I need, so that I can build a cart from an image instead of typing.

#### Acceptance Criteria

1. WHEN the user activates the Snap_Icon, THE Instant_Engine SHALL open the device camera capture interface or a file picker restricted to image files of supported formats (JPEG, PNG) and no larger than 10 MB.
2. WHEN the user provides an image, THE Instant_Engine SHALL, within 1 second, display a processing state containing status text indicating that image analysis is in progress while the Vision_Processor analyzes the image.
3. WHEN the Vision_Processor completes image analysis successfully, THE Vision_Processor SHALL produce a structured shopping intent describing the required items.
4. WHEN the Vision_Processor produces a structured shopping intent, THE Instant_Engine SHALL route the user to the Category_Grid experience pre-populated with the identified items.
5. IF the routing decision is reached without a valid structured shopping intent, THEN THE Instant_Engine SHALL remain on the current screen and SHALL NOT route to the Category_Grid.
6. IF pre-population of identified items into the Category_Grid fails, THEN THE Instant_Engine SHALL display an error message stating that the items could not be loaded and SHALL offer the user the option to retry, permitting up to 3 retry attempts.
7. IF the provided file is not a supported image format (JPEG, PNG) or exceeds 10 MB, THEN THE Instant_Engine SHALL display an error message identifying the supported image formats and the 10 MB maximum size, and SHALL remain on the Intent_Hub.
8. IF the Vision_Processor cannot derive a shopping intent from the image, THEN THE Instant_Engine SHALL display a message stating that no items were recognized and SHALL offer the user the option to enter the intent as text.
9. IF the Vision_Processor does not complete image analysis within 30 seconds, THEN THE Instant_Engine SHALL terminate the processing state, display an error message stating that the analysis timed out, and SHALL offer the user the option to retry.

### Requirement 4: Goal-Oriented Category Grid

**User Story:** As a shopper, I want products organized by the components my goal requires, so that I can compare and substitute alternatives without leaving the flow.

#### Acceptance Criteria

1. WHEN the Category_Grid loads for an intent, THE Instant_Engine SHALL display one Category_Row for each required component of the intent, ordered according to the intent's defined component sequence, within 2 seconds of the load being initiated.
2. THE Instant_Engine SHALL display within each Category_Row a Brand_Swiper containing all available product alternatives for that component, up to a maximum of 50 alternatives per Brand_Swiper.
3. IF a required component has no available product alternatives, THEN THE Instant_Engine SHALL display the corresponding Category_Row with an empty-state indication in place of selectable products and SHALL NOT designate a Selected_Item for that Category_Row.
4. THE Instant_Engine SHALL allow horizontal scrolling within each Brand_Swiper independently of the vertical scroll position of the Category_Grid.
5. WHEN the Category_Grid loads, THE Instant_Engine SHALL designate the first product in each non-empty Brand_Swiper as the Selected_Item for its Category_Row by default.
6. WHEN the user taps a product within a Brand_Swiper, THE Instant_Engine SHALL set that product as the Selected_Item for its Category_Row and SHALL display a visual selected state that distinguishes the Selected_Item from all unselected products in the same Brand_Swiper.
7. WHEN the Selected_Item in a Category_Row changes, THE Instant_Engine SHALL update the Cart_Summary to reflect the newly selected product and its price within 500 milliseconds of the change.

### Requirement 5: Super Quick Mode 3-Tier Basket

**User Story:** As a shopper who values speed, I want three ready-made baskets at different price levels, so that I can pick one and check out immediately.

#### Acceptance Criteria

1. WHEN Super_Quick_Mode loads, THE Instant_Engine SHALL display three Basket_Tier tabs ordered left to right and labeled Budget, Balanced, and Premium.
2. WHEN Super_Quick_Mode loads, THE Instant_Engine SHALL set the Balanced Basket_Tier as the active tab by default.
3. WHILE a Basket_Tier is active, THE Instant_Engine SHALL display a Cart_Summary listing each included item and the total basket price expressed in the store's currency.
4. WHEN the user selects a different Basket_Tier tab, THE Instant_Engine SHALL update the Cart_Summary item list and total price within 300 milliseconds to reflect the selected Basket_Tier.
5. WHILE a Basket_Tier update is in progress for longer than 300 milliseconds, THE Instant_Engine SHALL display a processing indicator, and WHEN the update completes, THE Instant_Engine SHALL remove the processing indicator.
6. IF a Basket_Tier update fails to retrieve its items or total price, THEN THE Instant_Engine SHALL retain the previously active Basket_Tier's Cart_Summary and display an error indication that the selected Basket_Tier could not be loaded.
7. WHILE Super_Quick_Mode is active, THE Instant_Engine SHALL display the Checkout_Button as a sticky control anchored to the bottom of the screen.

### Requirement 6: Contextual Cross-Sell

**User Story:** As a shopper, I want relevant complementary items suggested as I shop, so that I can complete my outcome with one tap without feeling advertised to.

#### Acceptance Criteria

1. WHILE the user is in the Snap and Order mode or the Category_Grid mode, THE Instant_Engine SHALL display the Cross_Sell_Strip pinned to the bottom edge of the screen and remaining fixed in that position while the underlying content scrolls.
2. IF no products that share at least one category or theme attribute with the currently generated bundle are available, THEN THE Instant_Engine SHALL hide the Cross_Sell_Strip.
3. WHILE the Cross_Sell_Strip is displayed, THE Instant_Engine SHALL show between 3 and 4 products, inclusive.
4. THE Instant_Engine SHALL select Cross_Sell_Strip products that share at least one category or theme attribute with the currently generated bundle.
5. WHEN the user taps a product in the Cross_Sell_Strip, THE Instant_Engine SHALL display a loading state for at least 50 milliseconds.
6. WHEN the user taps a product in the Cross_Sell_Strip and the product is successfully added, THE Instant_Engine SHALL add that product to the cart and SHALL update the Cart_Summary total within 300 milliseconds.
7. IF adding a tapped Cross_Sell_Strip product to the cart fails, THEN THE Instant_Engine SHALL retain the prior Cart_Summary total unchanged and SHALL display an error indication that the product could not be added.

### Requirement 7: Intent Understanding

**User Story:** As a shopper, I want the system to understand my goal from natural language or an image, so that it can assemble the right components.

#### Acceptance Criteria

1. WHEN the Intent_Parser receives a natural-language intent of 1 to 500 characters, THE Intent_Parser SHALL produce a structured representation listing at least one required component for the intent.
2. WHEN the Vision_Processor receives an image, THE Vision_Processor SHALL produce a text intent of 1 to 500 characters that is passed to the Intent_Parser for structured component extraction.
3. IF the Intent_Parser cannot identify any required components for a submitted intent, THEN THE Instant_Engine SHALL display a message requesting a more specific intent, SHALL return the user to the Intent_Bar, and SHALL retain the user's submitted text in the Intent_Bar.
4. THE Intent_Parser SHALL complete structured component extraction for a typed intent within 5 seconds of submission.
5. IF a submitted natural-language intent exceeds 500 characters, THEN THE Instant_Engine SHALL reject the submission, SHALL display a message indicating the maximum allowed intent length, and SHALL retain the user's submitted text in the Intent_Bar.
6. IF the Intent_Parser does not complete structured component extraction within 5 seconds of submission, THEN THE Instant_Engine SHALL display an error message indicating the intent could not be processed and SHALL offer the user the option to retry.

### Requirement 8: Bundle Generation and Ranking

**User Story:** As a shopper, I want a complete and well-chosen bundle generated for my goal, so that I can trust the basket without manually building it.

#### Acceptance Criteria

1. WHEN the Bundle_Generator receives a structured intent, THE Bundle_Generator SHALL select exactly one default product from the Catalog for each required component of the intent.
2. THE Bundle_Generator SHALL rank the available product alternatives within each component in descending rank order and SHALL designate the highest-ranked product whose Catalog availability status is in-stock as the default Selected_Item.
3. IF a required component has no in-stock product available in the Catalog, THEN THE Bundle_Generator SHALL omit a default Selected_Item for that component and SHALL produce an indication identifying the unfulfilled component, while still generating the bundle for all remaining components.
4. WHEN the Bundle_Generator generates a bundle, THE Bundle_Generator SHALL produce a Confidence_Score for the bundle as an integer value between 0 and 100 inclusive.
5. WHEN the Bundle_Generator has generated and populated all three Basket_Tiers with products, THE Bundle_Generator SHALL ensure the Budget tier total price is less than or equal to the Balanced tier total price and the Balanced tier total price is less than or equal to the Premium tier total price.
6. WHERE a standard bundle has been previously generated and cached, THE Instant_Engine SHALL retrieve the cached bundle from Redis within 300 milliseconds rather than regenerating the bundle.
7. IF retrieval of a cached bundle from Redis fails, THEN THE Instant_Engine SHALL regenerate the bundle using the Bundle_Generator without displaying an error to the user.

### Requirement 9: Performance and Speed

**User Story:** As a time-poor shopper, I want the experience to be fast, so that I can complete a purchase in seconds.

#### Acceptance Criteria

1. WHEN the user submits a typed intent, THE Instant_Engine SHALL display the resulting Category_Grid within 8 seconds.
2. WHEN the user provides an image through Snap and Order, THE Instant_Engine SHALL display the resulting Category_Grid within 12 seconds.
3. WHEN the user switches between Basket_Tier tabs, THE Instant_Engine SHALL update the displayed basket within 300 milliseconds.
4. WHEN the Instant_Engine starts an operation that is expected to take longer than 1 second, THE Instant_Engine SHALL display a visible processing indicator within 200 milliseconds of the operation starting.
5. IF a typed intent operation does not produce a Category_Grid within 8 seconds, THEN THE Instant_Engine SHALL stop the operation and display an error indicating that the request could not be completed in time, while preserving the user's original typed intent.
6. IF a Snap and Order image operation does not produce a Category_Grid within 12 seconds, THEN THE Instant_Engine SHALL stop the operation and display an error indicating that the image could not be processed in time, while retaining the submitted image for retry.

### Requirement 10: Trust and Explainability

**User Story:** As a shopper, I want to understand why items were suggested, so that I can trust the generated bundle.

#### Acceptance Criteria

1. WHEN the Instant_Engine displays a generated bundle with a Confidence_Score of 1 or greater, THE Instant_Engine SHALL display a textual explanation that names each included required component and states how the bundle addresses the expressed intent.
2. WHERE a generated bundle has a Confidence_Score equal to 0, THE Instant_Engine SHALL omit the bundle explanation.
3. WHEN the Category_Grid loads, THE Instant_Engine SHALL display, for each Category_Row, the component name that the row fulfills within the user's goal.
4. WHEN a generated bundle has a Confidence_Score between 0 and 49 inclusive, THE Instant_Engine SHALL display a notice stating that the bundle has low confidence and prompting the user to review and refine the bundle.
5. WHEN a generated bundle has a Confidence_Score between 50 and 100 inclusive, THE Instant_Engine SHALL NOT display the low-confidence review notice.

### Requirement 11: Error and Unavailable-Item Handling

**User Story:** As a shopper, I want the system to recover gracefully when something fails or an item is unavailable, so that my shopping flow is not blocked.

#### Acceptance Criteria

1. IF a request to the multi-modal LLM API returns an error or does not return a response within 10 seconds, THEN THE Instant_Engine SHALL display an error message indicating that the request could not be completed, SHALL retain the user's current selections without modification, and SHALL offer a retry option allowing up to 3 retry attempts.
2. IF a Selected_Item becomes unavailable in the Catalog, THEN THE Bundle_Generator SHALL replace the unavailable item with the available alternative that has the highest relevance-ranking score within the same component.
3. WHEN the Bundle_Generator substitutes an unavailable item, THE Instant_Engine SHALL display a substitution indicator on the affected Category_Row within 2 seconds of the substitution.
4. IF a substitution indicator cannot be displayed for an affected Category_Row, THEN THE Instant_Engine SHALL disable the Checkout_Button until the indicator is displayed.
5. IF no available alternative exists for a required component, THEN THE Instant_Engine SHALL mark the affected Category_Row as unavailable and SHALL exclude that component's price from the Cart_Summary total.
6. WHEN all 3 retry attempts to the multi-modal LLM API have failed, THE Instant_Engine SHALL display an error message indicating that the operation cannot continue and SHALL retain the user's current selections without modification.

### Requirement 12: Checkout

**User Story:** As a shopper, I want to finalize my purchase with a single action, so that checkout does not add friction to the experience.

#### Acceptance Criteria

1. WHEN the user activates the Checkout_Button, THE Instant_Engine SHALL submit the items in the currently active Cart_Summary as an order within 2 seconds.
2. WHEN an order is submitted successfully, THE Instant_Engine SHALL display, within 2 seconds, an order confirmation that includes the ordered items and the total price charged, where the total price is greater than or equal to 0.
3. IF the Cart_Summary contains no available items, THEN THE Instant_Engine SHALL disable the Checkout_Button and SHALL display a message stating that the cart is empty.
4. WHILE an order submission is in progress, THE Instant_Engine SHALL disable the Checkout_Button to prevent duplicate orders.
5. IF order submission fails or does not complete within 30 seconds, THEN THE Instant_Engine SHALL display an error message stating that the order was not placed, SHALL preserve the current Cart_Summary contents for retry, and SHALL re-enable the Checkout_Button.

### Requirement 13: Voice Intent Input

**User Story:** As a shopper, I want to speak my shopping intent and review the recognized text before submitting, so that I can express an outcome hands-free without typing.

#### Acceptance Criteria

1. THE Instant_Engine SHALL display the Mic_Button inside or directly adjacent to the Intent_Bar.
2. WHEN the user activates the Mic_Button, THE Instant_Engine SHALL request microphone permission from the browser before starting any audio recording.
3. IF the user denies microphone permission, THEN THE Instant_Engine SHALL remain on the Intent_Hub, SHALL display a message stating that microphone access is required for voice input, and SHALL keep the Intent_Bar available for typed input.
4. WHEN microphone permission is granted and the user activates the Mic_Button, THE Instant_Engine SHALL begin recording an Audio_Clip and SHALL display a recording indicator that shows the elapsed recording time in seconds.
5. WHILE an Audio_Clip is being recorded, WHEN the user activates the Mic_Button, THE Instant_Engine SHALL stop the recording.
6. WHEN a recording reaches a duration of 60 seconds, THE Instant_Engine SHALL stop the recording automatically.
7. THE Instant_Engine SHALL limit a recorded Audio_Clip to a maximum size of 10 MB.
8. WHERE the Client_Speech_Recognizer is available in the browser, WHEN recording of an Audio_Clip stops, THE Instant_Engine SHALL transcribe the recorded Audio_Clip into Recognized_Intent_Text on the frontend without sending the Audio_Clip to the backend.
9. WHERE the Client_Speech_Recognizer is not available in the browser, WHEN recording of an Audio_Clip stops, THE Instant_Engine SHALL send the recorded Audio_Clip to the Audio_Intent_Processor through the dedicated audio endpoint.
10. WHEN the Audio_Intent_Processor receives an Audio_Clip, THE Audio_Intent_Processor SHALL forward the Audio_Clip to the multi-modal LLM API and SHALL produce Recognized_Intent_Text that represents the spoken shopping intent.
11. WHEN Recognized_Intent_Text is produced, THE Instant_Engine SHALL populate the Intent_Bar with the Recognized_Intent_Text in an editable state.
12. WHEN the Instant_Engine populates the Intent_Bar with Recognized_Intent_Text longer than 200 characters, THE Instant_Engine SHALL retain the first 200 characters of the Recognized_Intent_Text in the Intent_Bar.
13. WHILE the Intent_Bar contains Recognized_Intent_Text that the user has not submitted, THE Instant_Engine SHALL allow the user to edit the Recognized_Intent_Text and SHALL require an explicit submit action before processing the intent.
14. WHEN the user submits Recognized_Intent_Text from the Intent_Bar, THE Instant_Engine SHALL process the submitted text through the same Intent_Parser flow used for manually typed intent.
15. IF the Client_Speech_Recognizer or the Audio_Intent_Processor produces empty or whitespace-only Recognized_Intent_Text, THEN THE Instant_Engine SHALL display a message stating that no speech was recognized and SHALL offer the user the option to record again or to enter the intent as typed text.
16. WHILE the Instant_Engine is transcribing an Audio_Clip through the Client_Speech_Recognizer or processing an Audio_Clip through the Audio_Intent_Processor, THE Instant_Engine SHALL display a processing indicator until Recognized_Intent_Text is produced or an error is displayed.
17. IF the Audio_Intent_Processor does not produce Recognized_Intent_Text within 30 seconds of receiving an Audio_Clip, THEN THE Instant_Engine SHALL terminate the processing state, SHALL display an error message stating that the audio could not be processed in time, and SHALL offer the user the option to retry.
18. IF a recorded Audio_Clip exceeds the 10 MB maximum size, THEN THE Instant_Engine SHALL discard the Audio_Clip, SHALL display a message stating that the recording exceeded the maximum allowed size, and SHALL offer the user the option to record again.
19. IF the Client_Speech_Recognizer returns an error or does not produce Recognized_Intent_Text within 30 seconds of transcription starting, THEN THE Instant_Engine SHALL terminate the processing state, SHALL display an error message stating that the audio could not be transcribed, and SHALL offer the user the option to record again or to enter the intent as typed text.
20. IF a recording is stopped within 1 second of starting or captures no audio, THEN THE Instant_Engine SHALL discard the Audio_Clip, SHALL display a message stating that no audio was captured, and SHALL offer the user the option to record again.
