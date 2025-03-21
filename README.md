# PlaygroundFinder

# 🎡 Playground Finder App

Welcome to **Playground Finder**! 🌳🎠 This app helps parents and caregivers find, rate, and schedule playdates at nearby playgrounds.

## 🚀 Features
- 🗺️ **See Playgrounds nearby** - thannks to input from our users
- 📸 **Upload Photos** – Share images of playgrounds.
- ⭐ **Rate & Review** – Leave ratings and reviews.
- 👨‍👩‍👧 **User Authentication** – Sign up, log in
- 📆 **Schedule Playdates** – Plan meetups with friends.

## 🛠️ Tech Stack
- **Frontend:** React (Hosted on Azure Web Apps)
- **Backend:** Supabase (Authentication & Database)
- **Hosting:** Azure


## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/playgroundfinderapp.git
   cd playgroundfinderapp
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file in the root directory and add:
     ```env
     REACT_APP_SUPABASE_URL=your_supabase_url
     REACT_APP_SUPABASE_ANON_KEY=your_supabase_key
     REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_key
     ```

4. Start the app:
   ```bash
   npm start
   ```

## 🌍 Deployment (Azure Web Apps)
1. Build the app:
   ```bash
   npm run build
   ```
2. Deploy using Azure CLI:
   ```bash
   az webapp up --name YourWebAppName --resource-group YourResourceGroup

---
Made with ❤️ for playful adventures! 🎠✨

