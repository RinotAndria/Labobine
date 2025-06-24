FROM node:18

RUN apt-get update && apt-get install -y python3 make g++

WORKDIR /app

# Exécute package.json depuis server/
COPY server/package*.json ./
RUN npm install

# Exécute le contenu du serveur
COPY server/ ./

# Exécute le dossier client/
COPY client/ ./client/

EXPOSE 3000

CMD ["npm", "start"]