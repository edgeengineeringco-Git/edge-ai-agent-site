FROM node:22-alpine
WORKDIR /app
COPY telegram-team-gateway/package.json telegram-team-gateway/server.mjs ./
ENV NODE_ENV=production
EXPOSE 8090
CMD ["npm", "start"]
