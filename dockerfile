FROM node:15.12.0

RUN mkdir /app
WORKDIR /app

COPY package*.json ./

RUN npm cache clean --force

RUN npm update 

RUN npm cache clean --force

RUN npm install

RUN npm install pm2 -g

RUN npm install forever -g

RUN npm install phantomjs-prebuilt -g

RUN npm install node-pre-gyp -g

COPY . .

EXPOSE 7000

ENV NODE_ENV=production
CMD ["npm", "start"]