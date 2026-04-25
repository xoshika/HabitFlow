from backend.app import app

# Vercel needs the 'app' variable to be available at the global level
# This line ensures Vercel's serverless handler can find your Flask instance
app = app 

# You don't need app.run() for Vercel, but keeping the if statement is fine
if __name__ == "__main__":
    app.run()