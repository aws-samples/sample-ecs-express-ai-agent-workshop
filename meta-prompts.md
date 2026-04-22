# Meta Prompts

All user prompts from this session.

1. could you memo my all prompts I say from now into meta-prompts.md?
2. I'll create an example project for developing Next.js, NestJS, and Prisma app on ECS Express Mode using the AI agent. So, could you remove android, apple, and windows directories and related files?
3. It uses only AWS. Could you remove Azure and Google Cloud related fiels such as *.tf?
4. It prospects custom domain such as BASE_DOMAIN_NAME env var and others. Could you remove it?
5. The app requires email verification on the sign-up flow. Could you change email verification to optional?
6. If AUTH_REQUIRE_EMAIL_VERIFICATION is set false, could you bypass 'check you email' screen in the sign-up flow?
7. Could you move all files and directories except .claude, .git, LICENSE, meta-promts.md into step-final dir?
8. Could you copy step-final as step-1 dir?
9. Could you remove all github actions, backend, and iac related files in step-1?
10. Could you replace an empty Next.js App Router app with step-1/web/app?
  - (correction) could you restore Dockerfiles.d/web and Dockerfiles.d/web-e2e-tests and run npx and pnpm commands via docker compose?
11. Could you simplify compose.yaml in step-1 adjust the empty Next.js app?
12. I think web-e2e-tests compose service is needed. isn't it?
13. Could you adjust web e2e tests in step-1? It's an empty Next.js app.
14. Could you run docker compose --profile=e2e-tests run --rm web-e2e-tests?
15. Could you simplify other files such as .env in step-1 adjust the empty Next.js app?
16. Could you copy step-final as step-2?
17. Could you remove backend and related files in step-2?
18. Could you replace an empty Next.js App Router app with step-2/web/app as same as step-1?
19. Could you replace e2e tests in step-2 as same as step-1?
20. Could you write prompts in step-1/prompts.md that need to you growth it from step-1 to step-2?
21. Could you gather and summarize each step-* and write out it in README.md?
22. Could you copy step-final as step-3?
23. Could you remove all backend features except health check with GIT_SHA in step-3?
24. Could keep and restore Swagger on backend?
25. Could you adjust and simplify web/app and web/e2e-tests for backend that has only git sha feature?
26. Why? error TS2688: Cannot find type definition file for 'jest'.
27. Why? error TS5011: The common source directory of 'tsconfig.build.json' is './src'. The 'rootDir' setting must be explicitly set.
28. The backend couldn't return git sha. Why? { "status": "ok", "gitSha": "undefined" }
29. sure. it's ok. could you revert it?
30. Could you write prompts in step-2 that need to you growth it to next step?
31. Could you gather and summarize each step-* and write out it in README.md?
32. Could you copy step-final as step-4?
33. Could you remove all features except health check or items from step-4?
34. Why? Property 'item' does not exist on type 'PrismaClient'.
35. I ran prisma:generate but I've still occured the same error. why?
36. Why? Failed to parse syntax of config file at "/work/backend/prisma.config.js"
37. Why? dependency backend failed to start: container step-4-backend-1 is unhealthy
38. Why? Cannot find module '/work/backend/dist/main'
39. I still occured the same error. Why? Cannot find module '/work/backend/dist/main'
40. Why? error TS5011: rootDir must be explicitly set (TypeScript 6)
41. Could you import items feature for web/app into step-4 from step-final?
42. You added items test into smoke spec. Is it proper?
43. Could you show http://localhost:3000/?
44. I've occured the error: items.map is not a function
45. Could you run it? (prisma:push)
46. Could you write prompts in step-3 that need to you growth it to next step?
47. Could you gather and summarize each step-* and write out it in README.md?
48. Could you copy step-final as step-5?
49. Could you remove features related OAuth2, email, i18n, and TOTP from step-5?
50. It needed some secret variables such as JWT secret. Is it no needed Secrets Manager?
51. Could you import screens such as sign-in into step-5 web/app from step-final?
52. Could you write prompts in step-4 that need to you growth it to next step?
53. Could you gather and summarize each step-* and write out it in README.md?
54. It's not exist Secrets Manger in step-4 IaC but step-4 uses RDS. Is it correct?
55. could you update each promts.md and README in step-* if needed?
56. Could you create step-0 dir and place prompts.md in it to grow to next step?
57. translate README to Japanese and save it as README.ja.md in repository top and each step
58. link the README.ja.md files in each step from the README.ja.md in top
59. could you link each previous and next step from each step?
60. let there be the same in english version
61. Could you insert text like following in each README in steps: (AI Agent implementation hint)
62. it seems duplicates 'Get Started' and 'Implementation via AI Agent' in step-0. could you resolve it?
63. could you add how to run terraform in each step mentions IaC such as step-2?
64. could you write about infrastructure and, persistent/default and ephemeral layers in right position?
65. you say, "you can completely eliminate idle costs." is it correct?
66. In /README.md, could you improve order each section more human friendly?
67. Could you improve intro section in README like this?: (production-ready foundation, AI-driven workflow)
68. could you insert suggestion and advice about LLM troubleshooting in the right position?
69. could you generate architecture diagrams for each step using mermaid.js and insert it in each README?
70. could you write expected outputs in each step?
71. I think it more easier to understand 'Expected Output After Completion' section is placed after 'Implementation via AI Agent' section in each README. How do you think?
72. Could you add 'tech stack' section to README in top?
73. the 'Architecture' diagram in README in each step is architecture diagram at start point. could you indicate it clearly?
74. Hmm... could you update each 'Architecture' section to more clearly describing 'not yet expected, it just start point'?
75. Could you add 'Who is this workshop best for?,' 'What you will learn,' 'Time & Cost Estimate,' and 'Prerequisites' in README?
76. could you write about optional learning path that creates an empty github repository and copy or prompting each step?
77. I think all cases start step-0 not step-1. How do you think?
78. So, I think you can merge option A and B. moreover, you can simplify step-1's description.
79. And, you can simplify 'Pick a step directory (start with `step-0/` or `step-1/`)' in 'How to Use' section.
80. In '[step-1](step-1/) — Empty Next.js App' section, you wrote 'Starting point: ...' Is it correct?
81. `step-2/.github` needs a github repository. could you mention it?
82. Hmm... it's an optional learning path, not required. could you fix it?
83. In expected output for step-2, it only returns gitsha if user mount repository root. isn't it?
84. Hmm... could you improve the comment more easily understanding by human?
85. Hmm... could you update the comment if learner runs this step as a subdirectory, doesn't have their own repository?
86. in second half steps, user should set secrets into secrets manager by themselves using a method such as AWS CLI. could you write out about it?
87. it seems needed in also step-3. doesn't it? → No, step-3 has no Secrets Manager. Starts from step-4.
88. Hmm... however, in `step-3/prompts.md`, user create secrets manager via an AI agent. → Added note in step-3 expected output linking to step-4 secrets setup.
89. I think it's not a part of expected outputs, it's a step of/after implementation via AI agent.
90. I think 'populate secrets' section in step-4 is good, but it seems DATABASE_URL is set by terraform. doesn't it?
91. oops. could you update comments about secrets manager in step-3, too?
92. you wrote `your-app-AUTH_JWT_SECRET` as example, but in tf files `${var.app_unique_id}/backend/AUTH_JWT_SECRET` is used. could you update your examples?
93. in step-2 and after steps, it seems user should build and push container images. could you add the text about it?
94. oops. it's also needed in step-1 because user implements ECR in the step using AI agent.
95. oops. I think `step-final/Dockerfiles.d/backend-build` is needed step-3 and after steps, and it should be created in step-2. could you update prompts.md in each step?
96. could you translate prompts.md to Japanese prompts as prompts.ja.md in each step?
97. in step-1, could you mention OIDC set up for github users?
98. could you mention it in step-2 as same as step-1 for users who start from step-2?
99. in step-1 and after steps, if user set github actions, user needs to set github actions variables and secrets. could you mention it refer `step-2/docs/ci.md`?
100. you wrote 'Build and push Docker images to ECR' in the note for github actions. is it correct? → No, removed it. GitHub Actions handles that automatically.
101. in step-5, could you add advice for SMTP services such as Amazon SES if user needed?
102. An SMTP service is optional. because this workshop material is able to bypass email verification. could you update the text?
103. could you write what next.js is? and what are e2e tests? in step-0?
104. could you move these glossaries into a `<details>`?
105. could you write what IaC is? and what's CI/CD? as glossaries in step-1?
106. could you add what containers are? and what ECS is? as glossaries in step-1?
107. could you move what containers are? to step-0 and add what docker compose is? in step-0 as glossaries?
108. sort step-0 glossaries: next.js, e2e tests, containers, docker compose
109. could you write glossaries in step-2 about nestjs?
110. could you insert the glossary what docker is? before docker compose in step-0?
111. could you write glossaries about rdbms, postgresql, rds, orm, prisma in step-3?
112. could you write glossary about jwt in step-4?
113. could you write glossaries about oauth2 and mfa in step-5?
114. I think glossaries are placed after 'Implementation via AI Agent' in each step is easier to understand. could you move these?
115. there is 'Get Started' in step-0. could you move the glossary part?
116. could you insert about container registry and ecr before ecs into step-1 glossary part?
