# Production Frontend Container with Nginx
FROM nginx:alpine

# Copy custom Nginx server configuration with API & Socket.io reverse proxying
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production static build artifacts
COPY dist /usr/share/nginx/html

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
