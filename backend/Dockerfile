FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install -g nodemon
RUN npm install --include=dev
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]
