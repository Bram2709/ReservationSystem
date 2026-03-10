using Microsoft.EntityFrameworkCore;
using Repository;
using Repository.Extensions;
using Service.Extensions;
using System.Net.Http.Headers;
using Collectors;
using Collectors.Scrapers;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var connectionString2 = builder.Configuration.GetConnectionString("DefaultConnection2");


// Add services to the container.
builder.Services.AddRepositories();
builder.Services.AddServices();

builder.Services.AddScoped<ISourceCollector, DevpostScraperCollector>();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString, sql => sql.EnableRetryOnFailure()));

builder.Services.AddDbContext<CollectorsDbContext>(options =>
    options.UseSqlServer(connectionString2, sql => sql.EnableRetryOnFailure()));

builder.Services.AddScoped<CollectorOrchestrator>();


builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

// Move migration logic here, using DI to get the DbContext.
if (!app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        dbContext.Database.Migrate();
    }
}

app.Run();