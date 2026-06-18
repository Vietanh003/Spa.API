# =============================================
#  Spa.API — Dockerfile cho Render (.NET 10)
# =============================================

# ---- Stage 1: build ----
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj trước để cache restore
COPY Spa.API/Spa.API.csproj Spa.API/
RUN dotnet restore Spa.API/Spa.API.csproj

# Copy nguyên project rồi publish
COPY Spa.API/ Spa.API/
RUN dotnet publish Spa.API/Spa.API.csproj -c Release -o /app/publish /p:UseAppHost=false

# ---- Stage 2: runtime ----
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish ./

# Render set PORT env. ASP.NET Core đọc qua ASPNETCORE_URLS.
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Spa.API.dll"]
