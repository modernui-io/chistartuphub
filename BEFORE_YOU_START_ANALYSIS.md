# Before You Start Journey Analysis

## Current Flow

### Page 1: `/before-you-start`
- **Title**: "Before You Start"
- **Content**: Introduction with Billy's personal message
- **Design**: White card on dark background (OLD design - not Bureau)
- **CTA**: "Explore the Ecosystem" button

### Page 2: `/navigate-toolkit`
- **Title**: "Navigate the Ecosystem"
- **Design**: Already has some Bureau elements (dark, serif typography)
- **Options**:
  1. **Direct Access** - Skip to directory
  2. **Personalized Assessment** - Take quiz
  3. **Community & Peers** - Connect with community
- Has search bar and filter

### Page 3: `/business-type-explorer`
- **Title**: "Define Your Starting Point"
- **Design**: Dark theme, has Bureau elements
- **Options**:
  1. **High-Growth Startup** (PRIMARY) - Browse Resources
  2. **I'm Exploring an Idea** - Explore Options
  3. **Service & Consulting** - Find Resources
  4. **Small Business** - Find Resources
  5. **Not Sure Yet** - Take Assessment

### Page 4: Assessment Flow (from "I'm Exploring an Idea")
- **Title**: "Find Your Path"
- **Design**: Step indicator (Step 1 of 3, 33%)
- **Question**: "What are you primarily selling?"
- **Options**:
  - My time or expertise (Consulting, Services, Freelance)
  - A tangible product or software (Apps, Goods, CPG)
  - I haven't decided yet

## Issues Identified

1. **Design Inconsistency**: `/before-you-start` has OLD white card design
2. **Too Many Steps**: 4+ pages before getting to resources
3. **"Define Your Starting Point"** - Unnecessary friction per user feedback
4. **"Operating System" language** - Still appears in footer
5. **Complex branching** - Multiple paths that may confuse users

## Proposed Simplification

### New Flow (2 pages max):
1. **Page 1**: Brief intro + immediate question: "What type of business are you building?"
   - Startup (tech, scalable)
   - Service/Consulting
   - Small Business
   - Not sure yet

2. **Page 2**: Based on selection, show tailored resources OR quick 2-3 question assessment

### Design Requirements:
- Apply Bureau design system throughout
- Remove "Operating System" language
- Make users feel smart, not interrogated
- Reduce cognitive load
- Path of least resistance

## Files to Update

1. `/src/pages/BeforeYouStart.jsx` - Main intro page
2. `/src/pages/NavigateToolkit.jsx` - Navigation options
3. `/src/pages/BusinessTypeExplorer.jsx` - Business type selection + assessment
4. Possibly consolidate into fewer pages
