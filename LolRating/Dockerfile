# ベースイメージ
FROM node:16

# 作業ディレクトリを設定
WORKDIR /app

# USER node

# 依存関係をコピー
COPY ./app/package.json ./app/package-lock.json ./

# 依存関係をインストール
RUN npm install

# アプリケーションコードをコピー
COPY ./app .

# Reactアプリをビルド
RUN npm run build

# アプリケーションを起動
CMD ["npm", "start"]

# ポートを公開
EXPOSE 3000
