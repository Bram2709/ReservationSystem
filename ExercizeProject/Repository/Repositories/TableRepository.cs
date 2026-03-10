using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Models.Models;
using Repository.Interfaces;

namespace Repository.Repositories
{
    internal class TableRepository(ApplicationDbContext context) : ITableRepository   
    {
        public async Task<IEnumerable<Table>> GetAllAsync()
        {
            return await context.Tables.ToListAsync();
        }

        public async Task<Table?> GetByIdAsync(int id)
        {
            return await context.Tables.FindAsync(id);
        }

        public async Task<Table> CreateAsync(Table table)
        {
            context.Tables.Add(table);
            await context.SaveChangesAsync();
            return table;
        }

        public async Task<Table> UpdateAsync(Table table)
        {
            context.Tables.Update(table);
            await context.SaveChangesAsync();
            return table;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var table = await context.Tables.FindAsync(id);
            if (table == null)
            {
                return false;
            }
            context.Tables.Remove(table);
            await context.SaveChangesAsync();
            return true;
        }
    }
}
