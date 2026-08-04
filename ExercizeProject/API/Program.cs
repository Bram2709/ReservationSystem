using Microsoft.EntityFrameworkCore;
using Repository;
using Repository.Extensions;
using Service.Extensions;
using System.Net.Http.Headers;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.IdentityModel.Tokens;
using System.IO.Compression;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");


builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],

            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };
    });

builder.Services.AddAuthorization();

// Add services to the container.
builder.Services.AddRepositories();
builder.Services.AddServices();

// Email: real SMTP when configured, otherwise log the mails (dev mode).
if (!string.IsNullOrEmpty(builder.Configuration["Email:SmtpHost"]))
    builder.Services.AddScoped<Service.Interface.IEmailSender, Service.Services.SmtpEmailSender>();
else
    builder.Services.AddScoped<Service.Interface.IEmailSender, Service.Services.LoggingEmailSender>();

// ~24h-ahead reservation reminder emails.
builder.Services.AddHostedService<API.Services.ReservationReminderService>();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString, sql => sql.EnableRetryOnFailure()));


// Compress API responses (the restaurants payload ships every table's geometry). Fastest
// level keeps CPU cost negligible while still shrinking JSON substantially over the wire.
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});
builder.Services.Configure<BrotliCompressionProviderOptions>(o => o.Level = CompressionLevel.Fastest);
builder.Services.Configure<GzipCompressionProviderOptions>(o => o.Level = CompressionLevel.Fastest);

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();


var app = builder.Build();

app.UseResponseCompression();

// Serve the built React SPA from the same origin as the API. The CI pipeline copies the
// Vite `dist` output into wwwroot before publish, so index.html + assets ship inside the app.
app.UseDefaultFiles();
app.UseStaticFiles();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// SPA fallback: any request not matched by a controller (api/*) or a real static file
// returns index.html, so client-side routes like /book/:id work on a hard refresh.
app.MapFallbackToFile("index.html");

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