FROM golang:1.23
COPY /backend /src
WORKDIR /src
RUN  CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -a --installsuffix cgo -o bin/app main.go

# CMD ["/src/bin/app"]

FROM alpine
EXPOSE 10000
COPY --from=0 /src/bin/app /app

CMD [ "/app" ]