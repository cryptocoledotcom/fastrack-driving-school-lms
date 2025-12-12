# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - link "Fastrack Driving School" [ref=e5] [cursor=pointer]:
      - /url: /
      - generic [ref=e6]: Fastrack Driving School
    - main [ref=e7]:
      - generic [ref=e9]:
        - heading "Welcome Back" [level=1] [ref=e10]
        - paragraph [ref=e11]: Sign in to continue your learning journey
        - generic [ref=e12]:
          - generic [ref=e13]:
            - generic [ref=e14]:
              - text: Email
              - generic [ref=e15]: "*"
            - textbox "Email *" [ref=e16]: instructor@fastrack.com
          - generic [ref=e17]:
            - generic [ref=e18]:
              - text: Password
              - generic [ref=e19]: "*"
            - textbox "Password *" [active] [ref=e20]: password123
          - link "Forgot Password?" [ref=e21] [cursor=pointer]:
            - /url: /forgot-password
          - button "Sign In" [ref=e22] [cursor=pointer]
        - paragraph [ref=e23]:
          - text: Don't have an account?
          - link "Sign Up" [ref=e24] [cursor=pointer]:
            - /url: /register
        - generic [ref=e25]: OR
        - button "Sign In with Google" [ref=e26] [cursor=pointer]
    - paragraph [ref=e28]: © 2025 Fastrack Driving School. All rights reserved.
  - paragraph [ref=e29]: Running in emulator mode. Do not use with production credentials.
```