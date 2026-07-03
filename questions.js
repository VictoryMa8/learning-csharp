"use strict";
/* =====================================================================
   STACK QUEST — QUESTION BANK
   Flow items:
     lesson    {title, body(html)}                           (teaches; +2 XP, no risk)
     mc        {q, code?, opts[], a(index), hint, why}
     fill      {q, code?, a[accepted], hint, why}
     bug       {q, code[lines], a(line index), hint, why}
     multifill {q, code with {{n}} tokens, blanks[[accepted]...], hint, why}
     parsons   {q, lines[correct order], hint, why}
     match     {q, pairs[[left,right]...], hint, why}
     code      {q, fnName, starter, tests[{args,expect}], solution, hint, why}
   Worlds are ordered learn → practice: each lesson is followed by the
   challenges that use it.
   ===================================================================== */

const WORLDS = [
{
  id: "csharp", name: "C# & .NET Citadel", icon: "🏰", color: "#a78bfa",
  desc: "LINQ pipelines, async/await, and value-type traps.",
  questions: [

    { type: "lesson", title: "LINQ in five minutes",
      body: `
<p>LINQ is how C# queries collections. Three methods do most of the work:</p>
<pre class="code">var names   = people.Select(p => p.Name);      // transform each item
var adults  = people.Where(p => p.Age >= 18);   // keep matching items
var sorted  = people.OrderByDescending(p => p.Age); // sort high → low</pre>
<p>They chain into <b>pipelines</b> that read like a sentence:</p>
<pre class="code">var top5 = trades
    .Where(t => t.Status == "Settled")   // filter first
    .OrderByDescending(t => t.Amount)    // then sort
    .Take(5)                             // then trim
    .ToList();                           // then EXECUTE</pre>
<p>That last line matters. LINQ uses <b>deferred execution</b>: <code>Where</code> and friends only <i>describe</i> a query. Nothing actually runs until something enumerates it — a <code>foreach</code>, <code>Count()</code>, or <code>ToList()</code>. Until then the query is a recipe, not a meal. If the source list changes before you enumerate, the query sees the <i>new</i> data.</p>
<p>One related trap: you can't add or remove items from a collection <b>while</b> you're foreach-ing over it — .NET throws "Collection was modified". Use <code>RemoveAll</code> or loop over a copy.</p>` },

    { type: "mc",
      q: "A LINQ query like <code>people.Where(p => p.Age > 30)</code> — when does the filtering actually run?",
      hint: "Remember: a LINQ chain is a recipe, not a meal. What forces the recipe to be cooked?",
      opts: [
        "Immediately, on the line where Where() is called",
        "When the result is enumerated (foreach, ToList, Count...)",
        "On a background thread as soon as it's declared",
        "When the compiler optimizes it at build time"
      ], a: 1,
      why: "LINQ uses <b>deferred execution</b>: Where() just builds a query. Nothing runs until you enumerate it — which also means enumerating twice runs it twice." },

    { type: "multifill",
      q: "Complete the LINQ pipeline: keep only settled trades, sort by amount (largest first), take 5, and execute the query into a list.",
      hint: "Filter → sort high-to-low → execute. The lesson's example pipeline is nearly identical.",
      code: "var top5 = trades\n    .{{0}}(t => t.Status == \"Settled\")\n    .{{1}}(t => t.Amount)\n    .Take(5)\n    .{{2}}();",
      blanks: [["Where"], ["OrderByDescending"], ["ToList"]],
      why: "<code>Where</code> filters, <code>OrderByDescending</code> sorts high→low, and <code>ToList()</code> forces the deferred query to actually execute and snapshot the results." },

    { type: "bug",
      q: "This throws an InvalidOperationException at runtime. Click the line that causes it.",
      hint: "The lesson's last paragraph: what are you not allowed to do to a collection mid-foreach?",
      code: [
        "var items = new List<int> { 1, 2, 3, 4 };",
        "foreach (var item in items)",
        "{",
        "    if (item % 2 == 0)",
        "        items.Remove(item);",
        "}"
      ], a: 4,
      why: "You can't modify a collection while enumerating it — <code>items.Remove(item)</code> inside the foreach throws \"Collection was modified\". Use <code>items.RemoveAll(i => i % 2 == 0)</code> or iterate over a copy." },

    { type: "match",
      q: "Match each LINQ method to its JavaScript array equivalent — you'll translate between these two daily.",
      hint: "Select transforms (what does that in JS?). Where keeps matches. Aggregate folds everything into one value.",
      pairs: [
        ["Select", "map"],
        ["Where", "filter"],
        ["Aggregate", "reduce"],
        ["FirstOrDefault", "find"],
        ["Any", "some"]
      ],
      why: "Same concepts, two syntaxes. Internalizing these pairs means learning one stack teaches you the other — C# on the backend, JS in the Vue frontend." },

    { type: "lesson", title: "async/await essentials",
      body: `
<p>I/O (HTTP calls, database queries, file reads) is slow. <code>async/await</code> lets a thread do other work while waiting, instead of blocking:</p>
<pre class="code">public async Task&lt;Trade&gt; GetTradeAsync(int id)
{
    var response = await _client.GetAsync($"/api/trades/{id}");
    response.EnsureSuccessStatusCode();            // throw early on 500s
    var json = await response.Content.ReadAsStringAsync();
    return JsonSerializer.Deserialize&lt;Trade&gt;(json);
}</pre>
<p>Rules of the road:</p>
<ul>
<li>An async method returns <code>Task</code> or <code>Task&lt;T&gt;</code>. The caller <code>await</code>s it.</li>
<li><b>Never <code>async void</code></b> (except UI event handlers): the caller can't await it, and its exceptions can crash the process.</li>
<li><b>Never block</b> with <code>.Result</code> or <code>.Wait()</code> — that's how deadlocks happen.</li>
<li>Two independent calls? Start both, <i>then</i> await both — they run concurrently:</li>
</ul>
<pre class="code">var ta = GetPricesAsync();     // starts running
var tb = GetPositionsAsync();  // also running
await Task.WhenAll(ta, tb);    // wait for both</pre>
<p>Awaiting them one-by-one (<code>await GetA(); await GetB();</code>) works but runs them sequentially — twice as slow.</p>` },

    { type: "parsons",
      q: "Assemble a correct async method that fetches a trade from an API. (Check the response succeeded before reading the body.)",
      hint: "Signature → open brace → make the call → check it worked → read the body → deserialize → close. It's the lesson's example.",
      lines: [
        "public async Task<Trade> GetTradeAsync(int id)",
        "{",
        "    var response = await _client.GetAsync($\"/api/trades/{id}\");",
        "    response.EnsureSuccessStatusCode();",
        "    var json = await response.Content.ReadAsStringAsync();",
        "    return JsonSerializer.Deserialize<Trade>(json);",
        "}"
      ],
      why: "The flow: await the HTTP call → verify success (fail fast on 500s) → await reading the body → deserialize and return. Every I/O step is awaited; nothing blocks a thread." },

    { type: "mc",
      q: "Why is <code>async void</code> considered dangerous compared to <code>async Task</code>?",
      hint: "Think about the caller: what two things can it not do with a void?",
      opts: [
        "It runs synchronously despite the async keyword",
        "It's slower because it can't be pooled",
        "Exceptions can't be caught by the caller and it can't be awaited",
        "It only works inside console apps"
      ], a: 2,
      why: "An <code>async void</code> method is fire-and-forget: the caller can't await it or catch its exceptions (they can crash the process). Reserve it for event handlers only." },

    { type: "lesson", title: "Null-handling & \"missing\" values",
      body: `
<p>Half of junior-dev bugs are null bugs. C# gives you a toolbelt:</p>
<pre class="code">// Checking strings: covers null, "", and "   "
if (string.IsNullOrWhiteSpace(input)) return "Required";

// ?? — null-coalescing: fallback when null
var name = trade.Broker ?? "Unknown";

// ?. — null-conditional: short-circuits instead of crashing
var length = customer?.Address?.City?.Length;   // null if any link is null</pre>
<p>When searching collections, decide what "not found" means:</p>
<pre class="code">orders.First(o => o.Id == 99);          // not found → EXCEPTION
orders.FirstOrDefault(o => o.Id == 99); // not found → null (or 0 for ints)</pre>
<p>Use <code>First</code> when a missing item is a genuine error you want to hear about loudly; <code>FirstOrDefault</code> when missing is a normal case you'll handle.</p>
<p>💰 Bonus rule for finance code: money is <code>decimal</code>, never <code>double</code>. Binary floating point can't represent 0.1 exactly — <code>0.1 + 0.2 == 0.3</code> is <i>false</i> with doubles.</p>` },

    { type: "fill",
      q: "Fill in the blank: the safest way to check a string is neither null, empty, nor just spaces.",
      hint: "It's the very first tool in the lesson's toolbelt — checks null OR whitespace.",
      code: "if (string.____(userInput))\n{\n    return \"Please enter a value\";\n}",
      a: ["IsNullOrWhiteSpace"],
      why: "<code>string.IsNullOrWhiteSpace()</code> covers null, \"\", and \"   \" in one call. <code>IsNullOrEmpty</code> misses whitespace-only strings." },

    { type: "mc",
      q: "<code>orders.First(o => o.Id == 99)</code> vs <code>orders.FirstOrDefault(o => o.Id == 99)</code> — what happens if no order matches?",
      hint: "One is loud about missing items, the other is quiet. Which is which?",
      opts: [
        "Both return null",
        "Both throw an exception",
        "First() throws; FirstOrDefault() returns the default value (null for classes)",
        "First() returns null; FirstOrDefault() throws"
      ], a: 2,
      why: "<code>First</code> throws InvalidOperationException on no match; <code>FirstOrDefault</code> returns <code>default</code>. Pick based on whether \"missing\" is an error or expected." },

    { type: "lesson", title: "Records, interfaces & dependency injection",
      body: `
<p>Modern C# models data with <b>records</b> — immutable by default, compared by <i>value</i>:</p>
<pre class="code">public record Trade(string Symbol, decimal Amount);

var a = new Trade("AAPL", 100m);
var b = new Trade("AAPL", 100m);
a == b;                             // TRUE — records compare contents
// (two class instances here would be FALSE — classes compare references)

var amended = a with { Amount = 250m };  // copy with one change,
                                         // original untouched</pre>
<p><b>Interfaces</b> are contracts: they say <i>what</i> a component does, hiding <i>how</i>:</p>
<pre class="code">public interface ITradeRepo
{
    Task&lt;Trade&gt; GetAsync(int id);
}

public class SqlTradeRepo : ITradeRepo { /* real database */ }
public class FakeTradeRepo : ITradeRepo { /* in-memory, for tests */ }</pre>
<p><b>Dependency injection (DI)</b> ties it together — consumers ask for the interface, and the app decides which implementation to hand them:</p>
<pre class="code">// Program.cs — one line decides the "how" for the whole app
builder.Services.AddScoped&lt;ITradeRepo, SqlTradeRepo&gt;();

public class TradeService(ITradeRepo repo)   // gets whatever is registered
{
    public Task&lt;Trade&gt; Load(int id) => repo.GetAsync(id);
}</pre>
<p>The payoff: unit tests swap in <code>FakeTradeRepo</code> without touching <code>TradeService</code> — no database needed. You'll see this pattern in every .NET codebase you open.</p>` },

    { type: "mc",
      q: "What does this print?",
      hint: "Records compare by contents; classes compare by reference.",
      code: "public record Trade(string Symbol, decimal Amount);\n\nvar a = new Trade(\"AAPL\", 100m);\nvar b = new Trade(\"AAPL\", 100m);\nConsole.WriteLine(a == b);",
      opts: ["True", "False", "Compile error — records can't use ==", "Only true if both are the same instance"],
      a: 0,
      why: "<b>True</b> — records get value equality for free: same property values means equal. Two <i>class</i> instances with identical values would be <code>False</code> (reference equality). Value equality is why records shine for messages and DTOs." },

    { type: "fill",
      q: "Fill in the keyword that copies a record while changing just one property (the original stays untouched).",
      hint: "It reads like English: 'trade ____ { Amount = 250m }'.",
      code: "public record Trade(string Symbol, decimal Amount);\n\nvar amended = trade ____ { Amount = 250m };",
      a: ["with"],
      why: "<code>with</code>-expressions are non-destructive mutation: a copy with changes. The original record is unchanged — the same immutability idea behind Akka messages and Vue's one-way props." },

    { type: "mc",
      q: "Your <code>TradeService</code> depends on <code>ITradeRepo</code> (injected) rather than <code>SqlTradeRepo</code> directly. What's the main win?",
      hint: "Think about what the unit tests can do now.",
      opts: [
        "Interfaces compile faster than classes",
        "Tests (and future changes) can swap in a fake or different implementation without touching TradeService",
        "It makes the SQL queries run asynchronously",
        "It's required by Azure App Service"
      ], a: 1,
      why: "Coding against the contract decouples the consumer from the implementation: unit tests inject an in-memory fake (no database!), and swapping SQL Server for something else later is a one-line registration change." }
  ],
  boss: { name: "The Deferred Dragon", icon: "🐉",
    intro: "It feeds on developers who think LINQ runs where it's written. Land 3 hits before it burns through your hearts.",
    questions: [
      { type: "mc",
        q: "What does this print?",
        hint: "When does the query actually run — before or after the Add?",
        code: "var nums = new List<int> { 1, 2, 3 };\nvar query = nums.Where(n => n > 1);\nnums.Add(4);\nConsole.WriteLine(query.Count());",
        opts: ["2", "3", "4", "Throws an exception"],
        a: 1,
        why: "Deferred execution! The query runs at <code>Count()</code>, after 4 was added — it sees {1,2,3,4} and counts 2, 3, 4 → <b>3</b>. Call <code>.ToList()</code> to snapshot results." },
      { type: "mc",
        q: "You need to call two independent APIs and want them running at the same time. Which is correct?",
        hint: "Start both tasks first, await both after. Which option never awaits one-at-a-time and never blocks?",
        opts: [
          "<code>var a = await GetA(); var b = await GetB();</code>",
          "<code>var ta = GetA(); var tb = GetB(); await Task.WhenAll(ta, tb);</code>",
          "<code>var a = GetA().Result; var b = GetB().Result;</code>",
          "<code>await Task.Run(() => { GetA(); GetB(); });</code>"
        ], a: 1,
        why: "Start both tasks <i>before</i> awaiting, then <code>Task.WhenAll</code>. Option 1 runs them sequentially; <code>.Result</code> blocks and risks deadlocks; option 4 fires them without awaiting the inner tasks." },
      { type: "mc",
        q: "What does this print?",
        hint: "The lesson's 💰 bonus rule — can binary floating point represent 0.1 exactly?",
        code: "double total = 0.1 + 0.2;\nConsole.WriteLine(total == 0.3);",
        opts: ["True", "False", "Compile error", "0.3"],
        a: 1,
        why: "<b>False</b> — binary floating point can't represent 0.1 exactly (0.1+0.2 ≈ 0.30000000000000004). For money in a middle-office system, always use <code>decimal</code>, never <code>double</code>." }
    ]
  }
},
{
  id: "sql", name: "SQL Server Dungeon", icon: "🗄️", color: "#f59e0b",
  desc: "Build real queries: joins, aggregates, and the NULLs in the dark.",
  questions: [

    { type: "lesson", title: "Anatomy of a query",
      body: `
<p>Every SELECT follows a strict clause order — memorize this skeleton:</p>
<pre class="code">SELECT   Department, COUNT(*) AS Headcount   -- 5. pick columns
FROM     Employees                           -- 1. source table
WHERE    IsActive = 1                        -- 2. filter ROWS
GROUP BY Department                          -- 3. collapse into groups
HAVING   COUNT(*) > 5                        -- 4. filter GROUPS
ORDER BY Headcount DESC;                     -- 6. sort the output</pre>
<p>The comments show the <i>logical processing order</i> — SQL runs FROM first, SELECT almost last. That explains the most common junior mistake:</p>
<ul>
<li><b>WHERE</b> runs <i>before</i> grouping → it filters individual rows, and <b>aggregates like COUNT(*) are not allowed in it</b> (they don't exist yet).</li>
<li><b>HAVING</b> runs <i>after</i> grouping → that's where aggregate conditions go.</li>
</ul>
<p>So "departments with more than 5 people" is <code>HAVING COUNT(*) > 5</code>, never <code>WHERE COUNT(*) > 5</code> — the latter won't even run.</p>` },

    { type: "parsons",
      q: "Assemble a valid query: active employees, grouped by department, only departments with more than 5 people, biggest first. (SQL clause order is strict!)",
      hint: "SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY. Straight from the lesson skeleton.",
      lines: [
        "SELECT Department, COUNT(*) AS Headcount",
        "FROM Employees",
        "WHERE IsActive = 1",
        "GROUP BY Department",
        "HAVING COUNT(*) > 5",
        "ORDER BY Headcount DESC;"
      ],
      why: "The mandatory clause order: <b>SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY</b>. WHERE filters rows before grouping; HAVING filters the groups after." },

    { type: "bug",
      q: "This query fails to run. Click the broken line.",
      hint: "One clause contains something that isn't allowed to exist yet at that stage of processing.",
      code: [
        "SELECT CustomerName, COUNT(*) AS OrderCount",
        "FROM Orders",
        "WHERE COUNT(*) > 3",
        "GROUP BY CustomerName",
        "ORDER BY OrderCount DESC;"
      ], a: 2,
      why: "Aggregates can't appear in WHERE — it runs before grouping, so COUNT(*) doesn't exist yet. Move the condition to <code>HAVING COUNT(*) > 3</code> after the GROUP BY." },

    { type: "lesson", title: "JOINs without tears",
      body: `
<p>A JOIN combines rows from two tables via a matching condition:</p>
<pre class="code">SELECT c.Name, o.Amount
FROM Customers c
INNER JOIN Orders o ON c.Id = o.CustomerId;  -- only customers WITH orders

SELECT c.Name, o.Amount
FROM Customers c
LEFT JOIN Orders o ON c.Id = o.CustomerId;   -- ALL customers; order columns
                                             -- are NULL when no match</pre>
<p>The choice is about what happens to non-matching rows:</p>
<ul>
<li><b>INNER JOIN</b> — keep only rows that match on both sides. Customers without orders <i>silently disappear</i> — a classic reporting bug.</li>
<li><b>LEFT JOIN</b> — keep every row from the left table; fill the right side with NULLs when there's no match.</li>
</ul>
<p>That NULL-fill enables a famous pattern — <b>finding rows without children</b>:</p>
<pre class="code">SELECT c.Name
FROM Customers c
LEFT JOIN Orders o ON c.Id = o.CustomerId
WHERE o.Id IS NULL;      -- customers who have NEVER ordered</pre>` },

    { type: "multifill",
      q: "Complete the query: total order amount per customer — <b>including customers who have never ordered</b>.",
      hint: "Which join keeps every customer? Joins match rows with the ON keyword; grouping is GROUP ___.",
      code: "SELECT c.Name, SUM(o.Amount) AS Total\nFROM Customers c\n{{0}} JOIN Orders o {{1}} c.Id = o.CustomerId\nGROUP {{2}} c.Name;",
      blanks: [["LEFT", "LEFT OUTER"], ["ON"], ["BY"]],
      why: "<code>LEFT JOIN</code> keeps every customer even with no matching orders (their Total comes back NULL). INNER JOIN would silently drop them — a classic reporting bug." },

    { type: "mc",
      q: "Customers has 10 rows; 6 of them have Orders. What does <code>SELECT c.Name FROM Customers c LEFT JOIN Orders o ON c.Id = o.CustomerId WHERE o.Id IS NULL</code> return?",
      hint: "This is the lesson's 'rows without children' pattern. Who has NULL order columns after a LEFT JOIN?",
      opts: [
        "All 10 customers",
        "The 6 customers with orders",
        "The 4 customers with no orders",
        "Nothing — the WHERE cancels the LEFT JOIN"
      ], a: 2,
      why: "LEFT JOIN keeps every customer, filling order columns with NULL when there's no match. Filtering <code>WHERE o.Id IS NULL</code> keeps exactly the unmatched ones." },

    { type: "lesson", title: "NULL, transactions & injection",
      body: `
<p><b>NULL is not a value — it's "unknown".</b> Comparing anything to unknown gives unknown, and unknown never passes a WHERE:</p>
<pre class="code">WHERE Broker = NULL      -- matches NOTHING, ever
WHERE Broker IS NULL     -- ✅ the only correct way
WHERE Broker IS NOT NULL -- ✅</pre>
<p><b>Transactions make multi-step changes all-or-nothing</b> (the A in ACID — atomicity). Essential when money moves:</p>
<pre class="code">BEGIN TRANSACTION;
UPDATE Accounts SET Balance = Balance - 100 WHERE Id = 1;
UPDATE Accounts SET Balance = Balance + 100 WHERE Id = 2;
COMMIT;      -- both happened
-- if anything failed: ROLLBACK;  -- neither happened</pre>
<p><b>SQL injection</b>: never glue user input into SQL strings. <code>"WHERE Name = '" + input + "'"</code> lets an attacker type <code>' OR 1=1 --</code> and read the whole table. Parameterized queries treat input strictly as data:</p>
<pre class="code">cmd.CommandText = "SELECT * FROM Users WHERE Name = @name";
cmd.Parameters.AddWithValue("@name", input);   // safe</pre>` },

    { type: "mc",
      q: "<code>SELECT * FROM Trades WHERE Broker = NULL</code> returns zero rows even though NULL brokers exist. Why?",
      hint: "NULL means 'unknown'. Can 'unknown = unknown' ever be true?",
      opts: [
        "NULL must be written in lowercase",
        "NULL is never equal to anything, even NULL — use IS NULL",
        "You need to cast NULL to VARCHAR first",
        "The table needs an index on Broker"
      ], a: 1,
      why: "In SQL, <code>NULL = NULL</code> evaluates to UNKNOWN, not true. Comparisons with NULL never match — always use <code>IS NULL</code> / <code>IS NOT NULL</code>." },

    { type: "match",
      q: "Match each SQL weapon to what it does.",
      hint: "Two are from this lesson (ROLLBACK, parameterized). HAVING was lesson 1. Indexes trade write speed for read speed.",
      pairs: [
        ["HAVING", "Filter groups after aggregation"],
        ["DISTINCT", "Remove duplicate rows"],
        ["ROLLBACK", "Undo everything in the transaction"],
        ["Index", "Faster reads, slower writes"],
        ["Parameterized query", "Blocks SQL injection"]
      ],
      why: "Five tools you'll reach for weekly. If DISTINCT keeps appearing in your queries, check whether a JOIN is fanning out rows instead." },

    { type: "mc",
      q: "A money transfer updates two accounts. The first UPDATE succeeds, the second fails. With BEGIN TRANSACTION ... what should happen?",
      hint: "All-or-nothing. Money must never be half-moved.",
      opts: [
        "COMMIT — at least one update worked",
        "ROLLBACK — both updates are undone, keeping data consistent",
        "Nothing — SQL Server auto-fixes partial updates",
        "Re-run only the failed UPDATE"
      ], a: 1,
      why: "Transactions are all-or-nothing (atomicity). On failure you ROLLBACK so money is never half-moved — the core reason transactions exist in middle-office systems." },

    { type: "lesson", title: "Window functions & CTEs",
      body: `
<p>GROUP BY collapses rows. <b>Window functions</b> compute across groups <i>without</i> collapsing — every row keeps its identity and gains a computed column:</p>
<pre class="code">SELECT CustomerId, OrderDate, Amount,
       ROW_NUMBER() OVER (PARTITION BY CustomerId          -- restart per customer
                          ORDER BY OrderDate DESC) AS rn,  -- 1 = newest
       SUM(Amount)  OVER (PARTITION BY CustomerId
                          ORDER BY OrderDate) AS RunningTotal
FROM Orders;</pre>
<ul>
<li><b>PARTITION BY</b> — the "restart the calculation per …" clause.</li>
<li><b>ROW_NUMBER()</b> — ranks rows inside each partition.</li>
<li><b>SUM(...) OVER (ORDER BY ...)</b> — a running total that grows row by row.</li>
</ul>
<p>A <b>CTE</b> (Common Table Expression) names a subquery so the main query stays readable — and it's how you filter on a window function (which isn't allowed directly in WHERE):</p>
<pre class="code">WITH Ranked AS (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY CustomerId
                                 ORDER BY OrderDate DESC) AS rn
    FROM Orders
)
SELECT * FROM Ranked WHERE rn = 1;    -- ⭐ latest order per customer</pre>
<p>That "latest row per group" pattern is the single most-reused reporting trick in middle-office SQL — memorize it.</p>` },

    { type: "multifill",
      q: "Complete the classic \"latest order per customer\" query.",
      hint: "Restart the numbering per customer with ____ BY; the newest row gets number…?",
      code: "WITH Ranked AS (\n    SELECT *, ROW_NUMBER() OVER (\n        {{0}} BY CustomerId ORDER BY OrderDate DESC) AS rn\n    FROM Orders\n)\nSELECT * FROM Ranked WHERE rn = {{1}};",
      blanks: [["PARTITION"], ["1"]],
      why: "<code>PARTITION BY CustomerId</code> restarts the numbering for each customer; <code>ORDER BY OrderDate DESC</code> makes the newest row #1; the CTE lets you filter <code>rn = 1</code> (window functions can't go directly in WHERE)." },

    { type: "mc",
      q: "What does <code>SUM(Amount) OVER (PARTITION BY AccountId ORDER BY TradeDate)</code> add to each row?",
      hint: "It doesn't collapse rows — it accumulates as it walks down each account's trades.",
      opts: [
        "The account's grand total, repeated on every row",
        "A running total: the sum of this account's amounts up to and including that row's date",
        "The average trade size",
        "Nothing — SUM requires GROUP BY"
      ], a: 1,
      why: "With an ORDER BY inside OVER, SUM becomes cumulative — a running balance per account. Without the ORDER BY it would be the flat per-partition total repeated on each row." },

    { type: "mc",
      q: "Why wrap a query in a CTE (<code>WITH X AS (...)</code>) instead of nesting subqueries?",
      hint: "Two reasons: one about humans, one about what WHERE can't see.",
      opts: [
        "CTEs are cached in memory and always faster",
        "Readability (named steps instead of nesting) — and it's how you filter on computed columns like ROW_NUMBER",
        "CTEs skip the transaction log",
        "Subqueries are deprecated in SQL Server"
      ], a: 1,
      why: "A CTE names a step so queries read top-down — and since a window function can't appear in its own query's WHERE, computing it in a CTE and filtering outside is the standard pattern." }
  ],
  boss: { name: "The Null Lich", icon: "💀",
    intro: "Ancient keeper of three-valued logic and physical row order. Land 3 hits to banish it.",
    questions: [
      { type: "mc",
        q: "Clustered vs nonclustered index — which statement is true?",
        hint: "One of them IS the table's physical storage order. How many physical orders can a table have?",
        opts: [
          "A table can have many clustered indexes",
          "The clustered index defines the physical order of table rows, so there can be only one",
          "Nonclustered indexes physically reorder the table",
          "Clustered indexes only work on GUID columns"
        ], a: 1,
        why: "The clustered index <i>is</i> the table's storage order — one per table (usually the primary key). Nonclustered indexes are separate structures pointing back at the rows." },
      { type: "mc",
        q: "Orders has 10 rows; 3 have a NULL ShipDate. What do <code>COUNT(*)</code> and <code>COUNT(ShipDate)</code> return?",
        hint: "COUNT(*) counts rows. COUNT(column) skips something…",
        opts: ["10 and 10", "10 and 7", "7 and 7", "10 and 3"],
        a: 1,
        why: "<code>COUNT(*)</code> counts rows; <code>COUNT(column)</code> counts non-NULL values in that column — so 10 and 7. This asymmetry causes real reporting bugs." },
      { type: "mc",
        q: "What does <code>ROW_NUMBER() OVER (PARTITION BY CustomerId ORDER BY OrderDate DESC)</code> give you?",
        hint: "PARTITION BY = restart the numbering per customer. ORDER BY DESC = newest gets number…?",
        opts: [
          "The total number of orders per customer",
          "A running total of order amounts",
          "A per-customer ranking (1 = most recent order), restarting at 1 for each customer",
          "Random sampling of orders"
        ], a: 2,
        why: "Window functions compute per-partition without collapsing rows. Filtering <code>WHERE rn = 1</code> gives \"latest order per customer\" — an everyday reporting pattern." }
    ]
  }
},
{
  id: "js", name: "JavaScript Jungle", icon: "🌴", color: "#facc15",
  desc: "Write real code, run real tests. Plus the event loop's wildlife.",
  questions: [

    { type: "lesson", title: "The big three: map, filter, reduce",
      body: `
<p>Most data-shaping in JavaScript is three array methods. None of them mutate the original — they return new values:</p>
<pre class="code">const trades = [
  { symbol: "AAPL", amount: 100, status: "settled" },
  { symbol: "MSFT", amount: 50,  status: "pending" },
];

trades.map(t => t.symbol);                  // ["AAPL", "MSFT"]  transform
trades.filter(t => t.status === "settled"); // [ {AAPL…} ]       keep matches
trades.reduce((sum, t) => sum + t.amount, 0); // 150            fold to one value</pre>
<p><code>reduce</code> deserves a closer look — it carries an accumulator through the array:</p>
<pre class="code">//        accumulator──┐   ┌──current item
trades.reduce((sum,    t) => sum + t.amount, 0);
//                            └─ new accumulator   └─ starting value</pre>
<p>They chain, just like LINQ (<code>map</code>=Select, <code>filter</code>=Where, <code>reduce</code>=Aggregate):</p>
<pre class="code">const settledTotal = trades
  .filter(t => t.status === "settled")
  .reduce((sum, t) => sum + t.amount, 0);</pre>
<p>Also handy: arrays are zero-indexed, so the last element is <code>arr[arr.length - 1]</code> (or <code>arr.at(-1)</code>), and <code>[...new Set(arr)]</code> removes duplicates in one move.</p>` },

    { type: "code",
      q: "⚒️ Code Forge: implement <code>sumSettled</code> — sum the <code>amount</code> of trades whose status is <code>\"settled\"</code>. Your code runs against real tests.",
      hint: "The lesson's last example is 90% of the answer: filter for settled, then reduce to a sum.",
      fnName: "sumSettled",
      starter: "function sumSettled(trades) {\n  // trades: [{ symbol: \"AAPL\", amount: 120.5, status: \"settled\" }, ...]\n  // Return the sum of `amount` where status === \"settled\".\n\n}",
      tests: [
        { args: [[{symbol:"AAPL",amount:100,status:"settled"},{symbol:"MSFT",amount:50,status:"pending"},{symbol:"GOOG",amount:25,status:"settled"}]], expect: 125 },
        { args: [[{symbol:"X",amount:10,status:"pending"}]], expect: 0 },
        { args: [[]], expect: 0 }
      ],
      solution: "function sumSettled(trades) {\n  return trades\n    .filter(t => t.status === \"settled\")\n    .reduce((sum, t) => sum + t.amount, 0);\n}",
      why: "This is C#'s <code>trades.Where(t => t.Status == \"Settled\").Sum(t => t.Amount)</code> in JavaScript clothing — filter then fold. You'll write this exact shape in both languages." },

    { type: "code",
      q: "⚒️ Code Forge: implement <code>unique</code> — return a new array with duplicates removed, keeping the original order.",
      hint: "The lesson's final line: a Set keeps each value once, and spread (…) turns it back into an array.",
      fnName: "unique",
      starter: "function unique(values) {\n  // unique([1, 2, 2, 3, 1]) => [1, 2, 3]\n\n}",
      tests: [
        { args: [[1, 2, 2, 3, 1]], expect: [1, 2, 3] },
        { args: [["a", "b", "a"]], expect: ["a", "b"] },
        { args: [[]], expect: [] }
      ],
      solution: "function unique(values) {\n  return [...new Set(values)];\n}",
      why: "<code>Set</code> stores each value once and preserves insertion order; spreading it back gives an array. The C# cousin is <code>values.Distinct().ToList()</code>." },

    { type: "code",
      q: "⚒️ Code Forge: this function should return the last trade but returns <code>undefined</code>. Fix the bug.",
      hint: "An array of length 3 has indexes 0, 1, 2. What's the highest valid index?",
      fnName: "lastTrade",
      starter: "function lastTrade(trades) {\n  // BUG: always returns undefined. Find and fix it.\n  return trades[trades.length];\n}",
      tests: [
        { args: [["buy AAPL", "sell MSFT", "buy GOOG"]], expect: "buy GOOG" },
        { args: [["only trade"]], expect: "only trade" }
      ],
      solution: "function lastTrade(trades) {\n  return trades[trades.length - 1];\n  // or the modern way: return trades.at(-1);\n}",
      why: "Arrays are zero-indexed, so the last element lives at <code>length - 1</code>. <code>trades.at(-1)</code> is the modern readable alternative. Off-by-one errors: a lifelong companion." },

    { type: "lesson", title: "The event loop & async",
      body: `
<p>JavaScript runs on <b>one thread</b> with a loop that processes work in a strict order:</p>
<ol>
<li><b>Synchronous code</b> — runs top to bottom, first, always.</li>
<li><b>Microtasks</b> — promise callbacks (<code>.then</code>, code after <code>await</code>). Run as soon as sync code finishes.</li>
<li><b>Macrotasks</b> — <code>setTimeout</code>, <code>setInterval</code>, I/O events. Run after all pending microtasks — even <code>setTimeout(…, 0)</code> waits its turn.</li>
</ol>
<pre class="code">console.log(1);                                // sync
setTimeout(() => console.log(2), 0);           // macrotask
Promise.resolve().then(() => console.log(3));  // microtask
console.log(4);                                // sync
// prints: 1 4 3 2</pre>
<p><code>async/await</code> is promise syntax that reads top-to-bottom:</p>
<pre class="code">async function loadTrades() {
  const res  = await fetch("/api/trades");  // pause here, thread stays free
  const data = await res.json();
  return data;                              // (an async fn returns a Promise)
}</pre>
<p>Forget an <code>await</code> and you'll be holding a <code>Promise</code> object instead of the data — a classic bug that shows up as <code>[object Promise]</code> in the UI.</p>` },

    { type: "mc",
      q: "In what order does this print?",
      hint: "Sync first (all of it), then microtasks (promises), then macrotasks (timers).",
      code: "console.log(1);\nsetTimeout(() => console.log(2), 0);\nPromise.resolve().then(() => console.log(3));\nconsole.log(4);",
      opts: ["1 2 3 4", "1 4 3 2", "1 4 2 3", "1 3 4 2"],
      a: 1,
      why: "Sync code first (1, 4). Then <b>microtasks</b> (promise callbacks → 3) run before <b>macrotasks</b> (setTimeout → 2), even at 0ms. This is the event loop question you'll see everywhere." },

    { type: "fill",
      q: "Fill in the keyword so the fetched data is available before the next line runs (inside an async function).",
      hint: "The keyword that pauses an async function until a promise settles.",
      code: "async function loadTrades() {\n  const res = ____ fetch(\"/api/trades\");\n  const data = ____ res.json();\n  return data;\n}",
      a: ["await"],
      why: "<code>await</code> pauses the async function until the promise settles. Forgetting it means you're working with a Promise object instead of the value — a classic bug." },

    { type: "lesson", title: "Scope traps: var, this, typeof",
      body: `
<p>Three legacy quirks every interviewer loves:</p>
<p><b>1. <code>var</code> is function-scoped and hoisted.</b> Every loop iteration shares one variable, and declarations float to the top with value <code>undefined</code>:</p>
<pre class="code">for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i));   // 3 3 3 — one shared i!
}
// fix: use let → each iteration gets its own i → 0 1 2

console.log(x);   // undefined (not an error — var hoists)
var x = 5;</pre>
<p>Rule: use <code>const</code> by default, <code>let</code> when reassigning, <code>var</code> never.</p>
<p><b>2. Arrow functions don't have their own <code>this</code></b> — they inherit it from where they were <i>written</i> (lexical scope). Great for callbacks, wrong for object methods that need a dynamic <code>this</code>.</p>
<p><b>3. <code>typeof null === "object"</code></b> — a 1995 bug kept forever for compatibility. Check null with <code>value === null</code>.</p>` },

    { type: "mc",
      q: "What does this print?",
      hint: "var = one shared variable. What is i by the time the timeouts fire?",
      code: "for (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 10);\n}",
      opts: ["0 1 2", "3 3 3", "0 0 0", "undefined ×3"],
      a: 1,
      why: "<code>var</code> is function-scoped: all three callbacks share one <code>i</code>, which is 3 by the time they run. Using <code>let</code> gives each iteration its own binding → 0 1 2." },

    { type: "mc",
      q: "How does <code>this</code> behave inside an arrow function?",
      hint: "Arrows don't get their own — where do they take it from?",
      opts: [
        "It's always the global object",
        "It's whatever object the function is called on",
        "It's inherited from the surrounding scope where the arrow was defined",
        "Arrow functions can't access this"
      ], a: 2,
      why: "Arrows don't get their own <code>this</code> — they capture it lexically. That's why they're perfect for callbacks, but wrong for object methods that need dynamic <code>this</code>." },

    { type: "mc",
      q: "What does <code>console.log(typeof null)</code> print?",
      hint: "It's the lesson's '1995 bug kept forever'.",
      opts: ["\"null\"", "\"undefined\"", "\"object\"", "\"boolean\""],
      a: 2,
      why: "<code>typeof null === \"object\"</code> is a legendary bug kept for backwards compatibility. To check for null, use <code>value === null</code>." },

    { type: "lesson", title: "Destructuring, spread & closures",
      body: `
<p><b>Destructuring</b> unpacks values; <b>spread (…)</b> copies and merges — both are everywhere in modern JS and Vue code:</p>
<pre class="code">const trade = { symbol: "AAPL", amount: 100, status: "settled" };

const { symbol, amount } = trade;        // pull out fields
const { status, ...rest } = trade;       // rest = everything else

const copy   = { ...trade };             // shallow copy
const merged = { ...defaults, ...overrides };  // later keys WIN conflicts
const longer = [...trades, newTrade];    // new array, one item appended</pre>
<p>That "later keys win" rule makes spread perfect for settings/config merging — same idea as appsettings.json being overridden by environment config in .NET.</p>
<p><b>Closures</b>: an inner function keeps access to its outer function's variables — even after the outer function has returned:</p>
<pre class="code">function makeCounter() {
  let count = 0;                 // lives on, privately, inside the closure
  return () => ++count;
}
const tick = makeCounter();
tick(); tick();                  // 1, then 2 — count survives between calls</pre>
<p>Closures are how callbacks "remember" data, and why the <code>var</code>-in-a-loop trap from the previous lesson happens: all three callbacks closed over the <i>same</i> variable.</p>` },

    { type: "code",
      q: "⚒️ Code Forge: implement <code>mergeSettings</code> — combine defaults with user overrides into a <b>new</b> object, overrides winning conflicts. Don't modify either input.",
      hint: "One line of spread: defaults first, overrides second — later keys win.",
      fnName: "mergeSettings",
      starter: "function mergeSettings(defaults, overrides) {\n  // mergeSettings({theme:\"light\", pageSize:25}, {theme:\"dark\"})\n  //   => { theme: \"dark\", pageSize: 25 }\n\n}",
      tests: [
        { args: [{theme:"light",pageSize:25},{theme:"dark"}], expect: {theme:"dark",pageSize:25} },
        { args: [{a:1},{}], expect: {a:1} },
        { args: [{},{b:2}], expect: {b:2} }
      ],
      solution: "function mergeSettings(defaults, overrides) {\n  return { ...defaults, ...overrides };\n}",
      why: "Spread copies both objects into a fresh one; because <code>overrides</code> comes last, its keys win. Neither input is touched — the same non-destructive style as C# record <code>with</code>-expressions." },

    { type: "code",
      q: "⚒️ Code Forge: implement <code>topSymbols</code> — return the symbols of the <code>n</code> largest trades by amount, largest first.",
      hint: "Copy (spread), sort with a NUMERIC comparator (b.amount - a.amount), slice n, map to symbols.",
      fnName: "topSymbols",
      starter: "function topSymbols(trades, n) {\n  // topSymbols([{symbol:\"A\",amount:5},{symbol:\"B\",amount:9}], 1) => [\"B\"]\n  // Careful 1: sort() without a comparator sorts as STRINGS.\n  // Careful 2: sort() mutates — don't wreck the caller's array.\n\n}",
      tests: [
        { args: [[{symbol:"AAPL",amount:100},{symbol:"MSFT",amount:250},{symbol:"GOOG",amount:50}], 2], expect: ["MSFT","AAPL"] },
        { args: [[{symbol:"X",amount:10},{symbol:"Y",amount:2}], 1], expect: ["X"] },
        { args: [[], 3], expect: [] }
      ],
      solution: "function topSymbols(trades, n) {\n  return [...trades]\n    .sort((a, b) => b.amount - a.amount)\n    .slice(0, n)\n    .map(t => t.symbol);\n}",
      why: "<code>[...trades]</code> protects the caller's array from sort's mutation, <code>(a, b) => b.amount - a.amount</code> sorts numerically descending, then slice + map shape the result. Four ideas from two lessons in one pipeline." },

    { type: "mc",
      q: "A function returns an inner function that uses the outer function's local variable. After the outer function returns, the inner function…",
      hint: "The makeCounter example — did count die when makeCounter returned?",
      opts: [
        "Crashes — the variable no longer exists",
        "Sees undefined",
        "Still has access to that variable, which lives on privately (a closure)",
        "Gets a frozen copy that can't change"
      ], a: 2,
      why: "The inner function <i>closes over</i> the variable — it stays alive, private, and mutable for as long as the function does. That's how <code>makeCounter</code> counts and how event handlers remember state." }
  ],
  boss: { name: "The Coercion Chimera", icon: "🦎",
    intro: "A three-headed beast of implicit conversion, hoisting, and default sorts. Land 3 hits to slay it.",
    questions: [
      { type: "mc",
        q: "What does <code>[10, 1, 3].sort()</code> return?",
        hint: "With no comparator, sort() converts everything to strings first. \"1\" vs \"10\" vs \"3\" alphabetically…",
        opts: ["[1, 3, 10]", "[10, 3, 1]", "[1, 10, 3]", "[10, 1, 3]"],
        a: 2,
        why: "Default <code>sort()</code> converts elements to <b>strings</b>: \"1\" &lt; \"10\" &lt; \"3\". For numbers, always pass a comparator: <code>.sort((a, b) => a - b)</code>." },
      { type: "mc",
        q: "What does this print?",
        hint: "var hoists the declaration to the top — but not the assignment.",
        code: "console.log(x);\nvar x = 5;",
        opts: ["5", "undefined", "ReferenceError", "null"],
        a: 1,
        why: "<code>var</code> declarations are hoisted but not their assignments — <code>x</code> exists as <code>undefined</code>. With <code>let</code>/<code>const</code> this would throw a ReferenceError instead." },
      { type: "mc",
        q: "What's a limitation of deep-cloning with <code>JSON.parse(JSON.stringify(obj))</code>?",
        hint: "What kinds of values can't survive a round-trip through JSON text?",
        opts: [
          "It only clones one level deep",
          "It loses functions, undefined values, and turns Dates into strings",
          "It mutates the original object",
          "It only works in Node.js"
        ], a: 1,
        why: "JSON round-tripping drops anything JSON can't represent: functions, <code>undefined</code>, and Dates become ISO strings. Use <code>structuredClone()</code> for a real deep clone in modern environments." }
    ]
  }
},
{
  id: "vue", name: "Vue Valley", icon: "🌄", color: "#42b883",
  desc: "Build components hands-on: reactivity, props down, events up.",
  questions: [

    { type: "lesson", title: "Reactivity: ref & computed",
      body: `
<p>Vue's core trick: wrap your state so Vue <i>notices</i> changes and re-renders automatically.</p>
<pre class="code">import { ref, computed } from 'vue';

const count  = ref(0);           // ref: works for ANY value (needed for primitives)
count.value++;                   // in &lt;script&gt;: access via .value
// in the template: {{ count }}  // auto-unwrapped, no .value

const trades = ref([]);
const total  = computed(() =>    // derived state: recalculates itself
  trades.value.reduce((sum, t) => sum + t.amount, 0)
);</pre>
<ul>
<li><b>ref()</b> boxes a value; you read/write <code>.value</code> in script. Templates unwrap it automatically — forgetting <code>.value</code> in script is <i>the</i> classic Vue bug.</li>
<li><b>reactive()</b> wraps objects in a Proxy — no <code>.value</code>, but it can't hold primitives like a bare number.</li>
<li><b>computed()</b> is cached derived state: it re-runs only when its dependencies change. A method re-runs on <i>every</i> render — so derived values (filtered lists, totals) belong in computed.</li>
<li><b>watch()</b> is for <i>side effects</i> when state changes (refetch, log, persist) — not for deriving values.</li>
</ul>` },

    { type: "mc",
      q: "In Vue 3's Composition API, when do you need <code>ref()</code> instead of <code>reactive()</code>?",
      hint: "One of them can't hold a bare number.",
      opts: [
        "Never — they're interchangeable",
        "For primitives (numbers, strings, booleans); reactive() only works on objects",
        "Only inside templates",
        "ref() is Vue 2 syntax only"
      ], a: 1,
      why: "<code>reactive()</code> wraps objects in a Proxy — it can't track a bare number. <code>ref()</code> boxes any value and exposes it as <code>.value</code> in script (auto-unwrapped in templates)." },

    { type: "parsons",
      q: "Assemble this component's script: a reactive list of trades plus a computed total that updates automatically.",
      hint: "script tag → imports → state (ref) → derived state (computed, three lines) → closing tag. It mirrors the lesson example.",
      lines: [
        "<script setup>",
        "import { ref, computed } from 'vue';",
        "const trades = ref([]);",
        "const total = computed(() =>",
        "  trades.value.reduce((sum, t) => sum + t.amount, 0)",
        ");",
        "</script>"
      ],
      why: "Imports first, then state (<code>ref</code>), then derived state (<code>computed</code>). Note <code>trades.value</code> in script — and that the computed re-runs itself whenever trades change. No manual wiring." },

    { type: "mc",
      q: "You display a filtered list derived from other state. Why use a <code>computed</code> instead of a method?",
      hint: "One of them is cached; the other re-runs on every single render.",
      opts: [
        "Methods can't return arrays",
        "Computed values are cached and only recalculate when their dependencies change",
        "Computed runs on the server",
        "There's no difference"
      ], a: 1,
      why: "A method reruns on <i>every</i> render; a computed recalculates only when its reactive dependencies change. For derived state (filtered lists, totals), computed is the default choice." },

    { type: "lesson", title: "Templates: the directives you'll actually use",
      body: `
<p>Five directives cover most template work:</p>
<pre class="code">&lt;!-- two-way bind an input to state --&gt;
&lt;input v-model="searchText" /&gt;

&lt;!-- listen to events (@ is shorthand for v-on:) --&gt;
&lt;button @click="save"&gt;Save&lt;/button&gt;

&lt;!-- bind an attribute to state (: is shorthand for v-bind:) --&gt;
&lt;button :disabled="!isValid"&gt;Save&lt;/button&gt;

&lt;!-- render a list — ALWAYS with a stable unique :key --&gt;
&lt;tr v-for="trade in trades" :key="trade.id"&gt;
  &lt;td&gt;{{ trade.symbol }}&lt;/td&gt;
&lt;/tr&gt;

&lt;!-- conditional rendering --&gt;
&lt;p v-if="error"&gt;{{ error }}&lt;/p&gt;      &lt;!-- adds/removes from DOM --&gt;
&lt;p v-show="loading"&gt;Loading…&lt;/p&gt;    &lt;!-- stays in DOM, toggles CSS --&gt;</pre>
<p>About <code>:key</code>: it gives each row a stable identity so Vue can reorder DOM nodes correctly. Use a real id — using the array <i>index</i> breaks when items are inserted, deleted, or reordered (Vue patches the wrong rows).</p>` },

    { type: "multifill",
      q: "Complete the template: two-way bind the search input, call <code>save</code> on click, and disable the button when the form is invalid.",
      hint: "The lesson's first three snippets, in order: v-model, @click, :disabled.",
      code: "<template>\n  <input {{0}}=\"searchText\" placeholder=\"Filter trades\" />\n  <button @{{1}}=\"save\" :{{2}}=\"!isValid\">Save</button>\n</template>",
      blanks: [["v-model"], ["click"], ["disabled"]],
      why: "<code>v-model</code> = two-way binding sugar. <code>@click</code> is shorthand for <code>v-on:click</code>; <code>:disabled</code> is shorthand for <code>v-bind:disabled</code>. These three are 80% of daily template work." },

    { type: "fill",
      q: "Fill in the special attribute Vue needs to track each item in a list efficiently.",
      hint: "Every v-for needs a stable identity attribute right next to it.",
      code: "<tr v-for=\"trade in trades\" :____=\"trade.id\">\n  <td>{{ trade.symbol }}</td>\n</tr>",
      a: ["key"],
      why: "<code>:key</code> gives each row a stable identity so Vue can reuse/reorder DOM nodes correctly. Use a unique id — the array index breaks when items are inserted or reordered." },

    { type: "lesson", title: "Component communication",
      body: `
<p>Components form a tree, and data flows one way:</p>
<pre class="code">Parent ──(props: data down)──▶ Child
Parent ◀──(events: news up)─── Child</pre>
<pre class="code">// Child.vue
const props = defineProps(['status']);      // read-only inputs
const emit  = defineEmits(['approve']);     // declared outputs

function onClick() {
  // ❌ props.status = 'approved';   // never mutate a prop!
  emit('approve', props.status);     // ✅ tell the parent instead
}</pre>
<pre class="code">&lt;!-- Parent.vue --&gt;
&lt;TradeRow :status="trade.status" @approve="approveTrade" /&gt;</pre>
<p>Why so strict? The parent owns the state. If children mutated props, a re-render would silently overwrite their change and nobody could tell where data changes came from. Vue warns loudly if you try.</p>
<p>And for loading data: kick off API fetches in <code>onMounted()</code> — it runs once when the component enters the page. Computeds must stay pure (no side effects like HTTP calls).</p>` },

    { type: "bug",
      q: "Vue logs a warning and the change may vanish on re-render. Click the problem line.",
      hint: "Which line breaks the '❌ never do this' rule from the lesson?",
      code: [
        "// Child.vue <script setup>",
        "const props = defineProps(['status']);",
        "",
        "function approve() {",
        "  props.status = 'approved';",
        "}"
      ], a: 4,
      why: "Props are read-only — mutating them breaks one-way data flow and gets overwritten when the parent re-renders. Emit an event instead: <code>emit('update:status', 'approved')</code>." },

    { type: "mc",
      q: "A child component needs to tell its parent that the user clicked Save. The Vue way is:",
      hint: "Data down, news up. What carries news upward?",
      opts: [
        "Mutate a prop the parent passed down",
        "Call a global variable",
        "Emit an event (<code>emit('save', payload)</code>) that the parent listens to with <code>@save</code>",
        "Access the parent via this.$parent and call its method"
      ], a: 2,
      why: "<b>Props down, events up.</b> Children emit events; parents own the state and react. This keeps data flow predictable and components reusable." },

    { type: "mc",
      q: "Where should a component fetch its initial data from an API?",
      hint: "The lesson's last paragraph — which lifecycle hook runs once when the component appears?",
      opts: [
        "In onMounted() (or in setup with a data-fetching composable)",
        "In the template",
        "In a computed property",
        "Inside v-for"
      ], a: 0,
      why: "<code>onMounted</code> runs once when the component is inserted — the standard place to kick off fetches. Computeds must stay pure (no side effects like HTTP calls)." },

    { type: "lesson", title: "watch, lifecycle & composables",
      body: `
<p><b>watch()</b> runs side effects when state changes — the "when X changes, do Y" tool:</p>
<pre class="code">import { watch } from 'vue';

watch(searchText, async (newValue) => {
  results.value = await searchTrades(newValue);   // refetch on change
});</pre>
<p><b>Lifecycle hooks</b> bracket a component's existence. The golden pair: whatever you start in <code>onMounted</code>, clean up in <code>onUnmounted</code> — or it leaks and keeps running after the component is gone:</p>
<pre class="code">let timer;
onMounted(()   => timer = setInterval(refresh, 5000));
onUnmounted(() => clearInterval(timer));   // ← forget this = memory leak</pre>
<p><b>Composables</b> are Vue's reuse unit: plain functions (named <code>useX</code>) that bundle refs, computeds, watchers, and lifecycle logic so any component can share them:</p>
<pre class="code">// useNow.js — a self-cleaning live clock any component can use
export function useNow() {
  const now = ref(new Date());
  let timer;
  onMounted(() => timer = setInterval(() => now.value = new Date(), 1000));
  onUnmounted(() => clearInterval(timer));
  return { now };
}

// any component:  const { now } = useNow();</pre>` },

    { type: "multifill",
      q: "Complete the component: refetch results whenever the search text changes, and stop the polling timer when the component is removed.",
      hint: "The 'when X changes do Y' function; then the cleanup twin of onMounted.",
      code: "import { watch, onMounted, onUnmounted } from 'vue';\n\n{{0}}(searchText, async (newValue) => {\n  results.value = await searchTrades(newValue);\n});\n\nlet timer;\nonMounted(() => timer = setInterval(refresh, 5000));\n{{1}}(() => clearInterval(timer));",
      blanks: [["watch"], ["onUnmounted"]],
      why: "<code>watch</code> reacts to state changes with side effects; <code>onUnmounted</code> is where started things get stopped. Forgetting the cleanup leaves a timer polling forever — a classic SPA memory leak." },

    { type: "parsons",
      q: "Assemble the <code>useNow</code> composable: a live clock that starts on mount and cleans up on unmount.",
      hint: "export → state → timer variable → start it (onMounted) → stop it (onUnmounted) → return → close.",
      lines: [
        "export function useNow() {",
        "  const now = ref(new Date());",
        "  let timer;",
        "  onMounted(() => timer = setInterval(() => now.value = new Date(), 1000));",
        "  onUnmounted(() => clearInterval(timer));",
        "  return { now };",
        "}"
      ],
      why: "State first, then the lifecycle pair (start on mount, clean on unmount), then return what consumers need. This shape — refs + lifecycle + return — is the anatomy of nearly every composable." },

    { type: "mc",
      q: "What is a Vue <b>composable</b>?",
      hint: "A plain function, conventionally named useSomething, that packages reactive logic.",
      opts: [
        "A component with no template",
        "A plain function (useX) that encapsulates reusable reactive logic — refs, watchers, lifecycle — for any component to share",
        "A Vue plugin installed with app.use()",
        "A CSS utility class system"
      ], a: 1,
      why: "Composables are Vue 3's answer to sharing stateful logic: extract it into a <code>useX()</code> function and every component gets its own independent instance of that logic. Data fetching, timers, form validation — all composable material." }
  ],
  boss: { name: "The Reactivity Wraith", icon: "👻",
    intro: "It severs the link between your state and your screen. Land 3 hits to dispel it.",
    questions: [
      { type: "bug",
        q: "Clicking the button does nothing and the count never changes. Click the broken line.",
        hint: "In script, refs aren't unwrapped. What's missing on count?",
        code: [
          "<script setup>",
          "import { ref } from 'vue';",
          "const count = ref(0);",
          "function increment() {",
          "  count++;",
          "}",
          "</scr" + "ipt>"
        ], a: 4,
        why: "In script, a ref is accessed via <code>.value</code> — it should be <code>count.value++</code>. (Templates auto-unwrap refs, which is why this trips people up.)" },
      { type: "mc",
        q: "When do you reach for <code>watch()</code> instead of <code>computed()</code>?",
        hint: "computed = derive a value. watch = DO something when state changes.",
        opts: [
          "To derive a value from other state",
          "To run side effects (API call, logging) when some state changes",
          "watch is just the Options API name for computed",
          "To render lists"
        ], a: 1,
        why: "<code>computed</code> = derive a value, no side effects. <code>watch</code> = \"when X changes, <i>do</i> something\" (refetch, validate, persist). Deriving with watch is a common code smell." },
      { type: "mc",
        q: "You used <code>:key=\"index\"</code> on a v-for list. The user deletes the middle row, but the wrong row's input text disappears. Why?",
        hint: "After deleting item 2, what index does item 3 get?",
        opts: [
          "Vue requires string keys",
          "Indexes shift after deletion, so Vue matches old DOM nodes to the wrong items",
          "v-for can't handle deletions",
          "The key must be named id"
        ], a: 1,
        why: "After deleting item 2, item 3 becomes index 2 — Vue thinks it's the same node and patches it in place, keeping stale DOM state. Stable unique ids as keys fix this." }
    ]
  }
},
{
  id: "akka", name: "Akka Actor Arena", icon: "🎭", color: "#ef4444",
  desc: "The actor model from zero: messages, mailboxes, supervision.",
  questions: [

    { type: "lesson", title: "Why actors exist",
      body: `
<p>The classic concurrency nightmare: two threads touching the same object at once. Locks "fix" it but breed deadlocks and complexity.</p>
<p>The <b>actor model</b> (Akka on the JVM, Akka.NET in C#) removes the problem instead: an actor is a tiny unit that owns its state <i>privately</i> and communicates only through <b>messages</b>.</p>
<pre class="code">┌────────── AccountActor ──────────┐
│  private state: _balance         │   nobody outside
│  mailbox: [Deposit, GetBalance…] │   can touch these
└──────────────────────────────────┘</pre>
<ul>
<li>Messages land in the actor's <b>mailbox</b> (a queue).</li>
<li>The actor processes them <b>one at a time</b> — so its state is never accessed concurrently. No locks, ever.</li>
<li>Thousands of actors run in parallel <i>with each other</i>, each internally sequential.</li>
</ul>
<p>Why it fits a middle-office platform: give every trade or account its own actor, and events for the same entity process in order and isolation, while the system as a whole handles thousands concurrently.</p>` },

    { type: "mc",
      q: "What is the core idea of the actor model (Akka / Akka.NET)?",
      hint: "Private state + messages. No sharing, no locks.",
      opts: [
        "Shared memory protected by locks",
        "Isolated units of state that communicate only by sending asynchronous messages",
        "One giant event queue for the whole app",
        "Database triggers coordinating services"
      ], a: 1,
      why: "An actor owns its state privately; nothing else can touch it. All interaction is via immutable messages — which eliminates the whole class of shared-memory race conditions." },

    { type: "mc",
      q: "Why don't actors need locks around their internal state?",
      hint: "How many messages does an actor process at once?",
      opts: [
        "Akka wraps every field in a mutex automatically",
        "Actors are stateless",
        "An actor processes messages from its mailbox one at a time — its state is never touched concurrently",
        "The .NET runtime freezes actor objects"
      ], a: 2,
      why: "The single-threaded illusion: each actor handles exactly one message at a time. As long as state stays inside the actor, there's no concurrent access — that's the superpower." },

    { type: "lesson", title: "Talking to actors",
      body: `
<p>You never hold an actor object or call its methods. You hold an <b>IActorRef</b> — an address — and send messages to it:</p>
<pre class="code">public class AccountActor : ReceiveActor
{
    private decimal _balance;

    public AccountActor()
    {
        Receive&lt;Deposit&gt;(msg => _balance += msg.Amount);
        Receive&lt;GetBalance&gt;(_ => Sender.Tell(_balance)); // reply to asker
    }
}

// from outside:
accountRef.Tell(new Deposit(100m));                  // fire-and-forget
var bal = await accountRef.Ask&lt;decimal&gt;(new GetBalance()); // expect a reply</pre>
<ul>
<li><b>Tell</b> — deliver the message and move on. The default; cheap and non-blocking.</li>
<li><b>Ask</b> — returns a <code>Task</code> that completes with the reply. Use at system boundaries (e.g., a web controller); it's heavier.</li>
<li><b>Sender</b> — inside an actor, the ref of whoever sent the current message. <code>Sender.Tell(reply)</code> is the request/response pattern.</li>
<li>Messages must be <b>immutable</b> (C# <code>record</code> types are perfect) — a mutable message shared by two actors would reintroduce racing on shared state.</li>
</ul>` },

    { type: "match",
      q: "Match each Akka concept to its role.",
      hint: "All five are defined in the lesson above — Tell/Ask/Sender bullet points.",
      pairs: [
        ["Tell", "Fire-and-forget message send"],
        ["Ask", "Send + get a Task with the reply"],
        ["Mailbox", "Queues messages, delivered one at a time"],
        ["Supervisor", "Decides restart/stop when a child fails"],
        ["IActorRef", "The handle you send messages to"]
      ],
      why: "The vocabulary of every Akka conversation. Prefer <code>Tell</code> inside the actor world; <code>Ask</code> belongs at the boundary (e.g., a web controller awaiting an answer)." },

    { type: "multifill",
      q: "Complete the actor: reply with the balance to whoever asked, then (from outside) send a deposit without waiting for a response.",
      hint: "Reply to the asker via the ref of whoever sent the current message; fire-and-forget is the cheap send.",
      code: "public class AccountActor : ReceiveActor\n{\n    private decimal _balance;\n\n    public AccountActor()\n    {\n        Receive<Deposit>(msg => _balance += msg.Amount);\n        Receive<GetBalance>(_ => {{0}}.Tell(_balance));\n    }\n}\n\n// From outside — fire and forget:\naccountRef.{{1}}(new Deposit(100m));",
      blanks: [["Sender"], ["Tell"]],
      why: "<code>Sender</code> is the actor that sent the current message — replying to it is the standard request/response pattern. From outside, <code>Tell</code> delivers the message and moves on." },

    { type: "fill",
      q: "Fill in the key property messages must have to be safe to send between actors.",
      hint: "Once sent, nobody should be able to change it. C# records give you this for free.",
      code: "// Messages should be ____ — once sent,\n// neither sender nor receiver can change them.\npublic record PriceUpdated(string Symbol, decimal Price);",
      a: ["immutable"],
      why: "If a message could be mutated after sending, two actors could race on it — reintroducing the shared-state problem actors exist to solve. C# <code>record</code> types are perfect for this." },

    { type: "lesson", title: "When things crash: supervision",
      body: `
<p>Actors form a family tree: every actor has a <b>parent</b> that supervises it. When a child throws, the parent's <b>supervision strategy</b> decides what happens:</p>
<pre class="code">child throws
   → parent's strategy consulted
       → Restart  (fresh instance, state reset — most common)
       → Stop     (actor is done)
       → Escalate (kick the decision upstairs)</pre>
<p>Key semantics of a <b>Restart</b>:</p>
<ul>
<li>The actor <i>instance</i> is replaced — internal state resets to known-good.</li>
<li>The <b>mailbox and address survive</b> — queued messages continue with the new instance.</li>
<li>The message that caused the crash is <b>dropped</b> by default (no poison loops).</li>
</ul>
<p>This is the <b>"let it crash"</b> philosophy: don't write tangled try/catch trying to repair corrupt state inside the actor. Let it fail fast; the supervisor restarts it clean. Recovery becomes a designed, predictable path instead of defensive spaghetti.</p>
<p>⚠️ One more rule: never <b>block</b> inside an actor (<code>.Result</code>, <code>.Wait()</code>). A blocked actor can't process messages — and if the reply it's waiting for needs that same actor or thread, the system deadlocks. Use <code>PipeTo(Self)</code> to await things asynchronously.</p>` },

    { type: "parsons",
      q: "Put the crash-recovery sequence in order — what happens when an actor throws while processing a message?",
      hint: "throw → parent consulted → restart → poison message dropped → mailbox continues. The lesson diagram has it.",
      lines: [
        "The actor throws an exception mid-message",
        "Its parent's supervision strategy is consulted",
        "The strategy says Restart: the instance is replaced with a fresh one",
        "The message that caused the crash is dropped",
        "The mailbox delivers the next queued message to the new instance"
      ],
      why: "This is \"let it crash\": failure handling is structural. The mailbox and address survive a restart — only the actor's internal state resets to known-good." },

    { type: "mc",
      q: "An actor throws an exception mid-message and its supervisor restarts it. What happens to its mailbox?",
      hint: "Restart replaces the instance. What survives?",
      opts: [
        "All queued messages are lost",
        "The mailbox survives — queued messages are processed by the fresh instance (the failing message is not retried by default)",
        "Messages are re-sent to the parent",
        "The mailbox is copied to a database"
      ], a: 1,
      why: "Restart replaces the actor's <i>instance</i> (state resets) but keeps its mailbox and address. The poison message that caused the crash is dropped by default, and processing continues." },

    { type: "mc",
      q: "Why does an actor system fit a middle-office platform processing streams of trade events?",
      hint: "Think one actor per trade/account: what does that buy you?",
      opts: [
        "Actors make SQL queries faster",
        "Per-entity actors (one per trade/account) give safe concurrent processing without locks, plus supervised fault recovery",
        "Actors eliminate the need for a database",
        "Actors are required by Azure"
      ], a: 1,
      why: "One actor per trade or account means events for the same entity are processed in order and isolation, while thousands of entities run concurrently — with supervision handling failures. That's the classic Akka use case." },

    { type: "lesson", title: "Async inside actors: PipeTo & timers",
      body: `
<p>Actors must never block — but real work involves async calls (HTTP, database). The pattern is <b>PipeTo</b>: start the task, and have its <i>result delivered back to you as a message</i>:</p>
<pre class="code">public class PriceActor : ReceiveActor
{
    private Prices _latest;

    public PriceActor()
    {
        Receive&lt;FetchPrices&gt;(_ =>
            _priceApi.GetPricesAsync()
                .PipeTo(Self));          // task result → message to myself

        Receive&lt;Prices&gt;(p => _latest = p);  // handled like any message
    }
}</pre>
<p>Why this shape? The actor stays free to process other messages while the task runs, and the result re-enters through the mailbox — so the one-message-at-a-time guarantee still protects the state. No <code>.Result</code>, no blocked threads, no deadlock.</p>
<p><b>Timers</b> follow the same philosophy — recurring work arrives as messages:</p>
<pre class="code">Context.System.Scheduler.ScheduleTellRepeatedly(
    initialDelay: TimeSpan.Zero,
    interval:     TimeSpan.FromMinutes(1),
    receiver:     Self,
    message:      new RunReconciliation(),
    sender:       Self);</pre>
<p>Everything an actor does — async results, scheduled jobs, replies — flows through the mailbox. One entrance, one message at a time. That uniformity is what keeps actor systems easy to reason about.</p>` },

    { type: "multifill",
      q: "Complete the actor: fetch prices asynchronously without blocking, delivering the result back as a message to this actor.",
      hint: "The task's result should be piped… to whom?",
      code: "public PriceActor()\n{\n    Receive<FetchPrices>(_ =>\n        _priceApi.GetPricesAsync()\n            .{{0}}({{1}}));\n\n    Receive<Prices>(p => _latest = p);\n}",
      blanks: [["PipeTo"], ["Self"]],
      why: "<code>PipeTo(Self)</code> turns a Task's result into a mailbox message — the actor keeps processing while the API call runs, and state is only touched from message handlers. The no-blocking rule, kept." },

    { type: "mc",
      q: "Why is <code>PipeTo(Self)</code> preferred over awaiting the task and updating state right there in the handler?",
      hint: "What protects actor state? Only code that runs as a message handler…",
      opts: [
        "PipeTo is shorter to type",
        "The result re-enters through the mailbox, so state is still only touched one message at a time — and the actor isn't blocked meanwhile",
        "Tasks can't be awaited in C#",
        "PipeTo retries failed tasks automatically"
      ], a: 1,
      why: "The mailbox is the actor's single entrance. By re-entering as a message, the async result is processed under the same one-at-a-time guarantee — no interleaved state mutations, no blocked dispatcher threads." },

    { type: "mc",
      q: "Your reconciliation actor must run every minute. The Akka way is:",
      hint: "Recurring work should arrive the same way everything else does.",
      opts: [
        "A while(true) loop with Thread.Sleep inside the actor",
        "Schedule a repeating message to the actor (ScheduleTellRepeatedly) — the timer tick arrives via the mailbox",
        "A separate background thread that calls the actor's methods",
        "Actors can't do recurring work"
      ], a: 1,
      why: "The scheduler sends the actor a message on an interval, so recurring work flows through the mailbox like everything else. Sleeping loops block; external threads calling methods break isolation." }
  ],
  boss: { name: "The Deadlock Demon", icon: "😈",
    intro: "It waits for replies that can never come. Land 3 hits to escape its grip.",
    questions: [
      { type: "bug",
        q: "This actor has a subtle concurrency bug. Click the dangerous line.",
        hint: "One line hands the actor's private mutable state to an outsider.",
        code: [
          "public class Portfolio : ReceiveActor {",
          "    private List<Trade> _trades = new();",
          "    public Portfolio() {",
          "        Receive<GetTrades>(_ =>",
          "            Sender.Tell(_trades));",
          "    }",
          "}"
        ], a: 4,
        why: "It sends its <i>mutable internal list</i> to another actor — now two actors share state, and the receiver can mutate it while this actor also uses it. Send a copy or an immutable snapshot: <code>Sender.Tell(_trades.ToImmutableList())</code>." },
      { type: "mc",
        q: "What is Akka's \"let it crash\" philosophy?",
        hint: "Who is responsible for recovery — the failing actor or its parent?",
        opts: [
          "Skip all error handling to keep code short",
          "Don't defensively code every failure inside the actor — let it fail, and let the supervisor restart it into a known-good state",
          "Crash the whole process on any error",
          "Only crash in dev, never in prod"
        ], a: 1,
        why: "Instead of tangled try/catch trying to repair corrupt state, the actor fails fast and the supervisor restarts it clean. Recovery becomes a designed, predictable path." },
      { type: "mc",
        q: "Inside an actor, someone writes <code>var result = otherActor.Ask&lt;Reply&gt;(msg).Result;</code>. What's the danger?",
        hint: "The lesson's ⚠️ warning: what happens when an actor blocks while waiting for a message?",
        opts: [
          "Nothing — that's standard Akka",
          "Blocking on .Result inside an actor can starve or deadlock the system (e.g., if the reply needs the blocked thread or the same actor)",
          "Ask can't carry a payload",
          ".Result is only illegal in console apps"
        ], a: 1,
        why: "Blocking a message-processing thread while waiting for another message is how actor systems deadlock. Use async patterns (e.g., <code>PipeTo(Self)</code>) so the actor keeps processing while it waits." }
    ]
  }
},
{
  id: "azure", name: "Azure Sky Fortress", icon: "☁️", color: "#38bdf8",
  desc: "The cloud services map: what runs where, and where secrets live.",
  questions: [

    { type: "lesson", title: "The service map",
      body: `
<p>Azure fluency starts with matching requirements to managed services. The spectrum runs from "you manage everything" to "Azure manages everything":</p>
<pre class="code">IaaS ──────────────────────▶ PaaS ─────────────▶ Serverless
Virtual Machines            App Service          Functions
(you patch the OS)          (you deploy code)    (you deploy functions,
                                                  pay per execution)</pre>
<p>The core cast for a typical C# web app:</p>
<ul>
<li><b>App Service</b> — host a web app/API. No VMs to patch; Azure handles scaling and TLS.</li>
<li><b>Azure Functions</b> — small event-driven code: a timer job (nightly reconciliation), a queue-message handler. Scales to zero; billed per run.</li>
<li><b>Azure SQL Database</b> — SQL Server as PaaS: same T-SQL, but backups, patching, and high availability are managed.</li>
<li><b>Blob Storage</b> — files and unstructured objects (PDF reports, uploads). Don't stuff big files in the database.</li>
<li><b>Service Bus</b> — durable message queues between services. If the consumer is down, messages wait — unlike an HTTP call, which just fails.</li>
<li><b>Application Insights</b> — telemetry: requests, exceptions, timings. Your first stop when someone says "the app is slow".</li>
</ul>` },

    { type: "match",
      q: "Match each Azure service to the job it's built for.",
      hint: "All six are in the lesson's core cast list.",
      pairs: [
        ["App Service", "Host a web API, no servers to manage"],
        ["Functions", "Nightly job, pay per execution"],
        ["Key Vault", "Store secrets and certificates"],
        ["Blob Storage", "Store generated PDF reports"],
        ["Service Bus", "Reliable message queues between services"],
        ["App Insights", "See production exceptions and slow requests"]
      ],
      why: "This map is half of Azure fluency: recognizing which managed service fits a requirement, instead of building it yourself on a VM." },

    { type: "mc",
      q: "What is Azure Functions best suited for?",
      hint: "Event-driven, scales to zero, billed per run.",
      opts: [
        "Hosting a full always-on website",
        "Small event-driven pieces of code (a timer job, react to a queue message) billed per execution",
        "Storing relational data",
        "Managing DNS records"
      ], a: 1,
      why: "Functions are serverless: they wake on a trigger (HTTP, timer, queue, blob), run your code, and scale to zero. Perfect for \"every night at 6pm, run the reconciliation job\"." },

    { type: "mc",
      q: "Azure SQL Database vs SQL Server on a VM — the main difference?",
      hint: "Same T-SQL either way. Who does the backups and patching?",
      opts: [
        "Azure SQL Database uses a different query language",
        "Azure SQL Database is a managed PaaS (backups, patching, HA handled); SQL on a VM is IaaS you administer yourself",
        "SQL on a VM is always cheaper",
        "Azure SQL Database can't do stored procedures"
      ], a: 1,
      why: "Same T-SQL skills, different responsibility line. PaaS handles the database plumbing; the VM route is for legacy features or full control needs." },

    { type: "lesson", title: "Secrets, identity & organization",
      body: `
<p>Three plumbing concepts that keep a cloud app secure and tidy:</p>
<p><b>Resource groups</b> — logical containers. One app environment = one group (rg-app-prod, rg-app-test) holding its App Service, database, storage… You deploy, permission, and delete it as a unit.</p>
<p><b>Key Vault</b> — the home for connection strings, API keys, and certificates, with access control and audit logs. Secrets do <i>not</i> live in appsettings.json in git — at a financial software company, a leaked connection string is an incident with a capital I.</p>
<p><b>Managed identity</b> — the elegant trick: your App Service gets an identity from Azure AD itself, and other services (Key Vault, SQL, Storage) grant that identity access directly.</p>
<pre class="code">without: app → needs secret → to fetch secrets → where does THAT secret live? 🐍
with:    app (managed identity) → Key Vault says "I know you" → no stored secrets</pre>
<p>A typical setup story: create the resource group → provision App Service + SQL → secrets into Key Vault → app gets managed identity with vault access → deploy code → watch it in App Insights.</p>` },

    { type: "parsons",
      q: "Put a typical deployment story in order — from empty subscription to monitored production app.",
      hint: "The lesson's last paragraph is this exact sequence: container → infrastructure → secrets → identity → code → monitoring.",
      lines: [
        "Create a resource group for the environment",
        "Provision the App Service and SQL Database inside it",
        "Put connection strings and secrets in Key Vault",
        "Give the app a managed identity with access to Key Vault",
        "Deploy the C# API to the App Service",
        "Watch requests and exceptions in Application Insights"
      ],
      why: "Infrastructure first, secrets second, identity third, code fourth, observability always. The resource group bounds the whole environment — you can tear it all down as one unit." },

    { type: "mc",
      q: "Where should database connection strings and API keys live in an Azure app?",
      hint: "Not in git. Where do secrets live with access control and audit logs?",
      opts: [
        "In appsettings.json committed to git",
        "Hardcoded, but base64-encoded",
        "In Azure Key Vault (or App Service settings referencing it)",
        "In a README so the team can find them"
      ], a: 2,
      why: "Key Vault stores secrets, keys, and certificates with access control and audit logs. Config in source control gets leaked — a serious incident at a financial software company." },

    { type: "mc",
      q: "What is a resource group in Azure?",
      hint: "One app environment, one container — deploy or delete it as a unit.",
      opts: [
        "A billing plan tier",
        "A logical container that groups related resources (app + database + storage) for shared lifecycle and permissions",
        "A cluster of virtual machines",
        "An Active Directory team"
      ], a: 1,
      why: "Resource groups organize everything for one app/environment together — deploy, tag, grant access, or delete it as a unit. Typically one per app per environment (rg-app-prod, rg-app-test)." },

    { type: "lesson", title: "Messaging & monitoring",
      body: `
<p>Two services talking over <b>direct HTTP</b> are chained together: if the receiver is down or slow, the sender fails with it. <b>Service Bus</b> cuts the chain — the sender drops a message on a durable queue and moves on; the receiver picks it up when it's ready:</p>
<pre class="code">HTTP:        OrderService ──✗──▶ ReportService (down = request lost)

Service Bus: OrderService ──▶ [ queue 📬 ] ──▶ ReportService
             (messages wait, retry, and dead-letter — never lost)</pre>
<ul>
<li><b>Queue</b> — point-to-point: each message is consumed by <i>one</i> receiver. Perfect for distributing work.</li>
<li><b>Topic</b> — pub/sub: one event fans out to <i>many</i> independent subscriptions. A single <code>TradeSettled</code> event can feed reporting, notifications, and audit — each on its own subscription.</li>
<li><b>Dead-letter queue</b> — messages that repeatedly fail processing get parked for inspection instead of poisoning the queue.</li>
</ul>
<p>And when something goes wrong in production, <b>Application Insights</b> is your evidence locker — it auto-collects every request, dependency call, exception, and timing. The support workflow: reproduce the report's time window in App Insights → find the failing dependency or exception → <i>then</i> act. Evidence before action, always.</p>` },

    { type: "mc",
      q: "Two services need to exchange messages reliably — if the consumer is down, messages must wait and not be lost. Use:",
      hint: "Durable queues. HTTP fails when the receiver is offline; what doesn't?",
      opts: ["Azure Service Bus", "Direct HTTP calls between services", "A shared text file in Blob Storage", "Azure CDN"],
      a: 0,
      why: "Service Bus is enterprise messaging: durable queues, ordering, dead-lettering, retries. It decouples producer from consumer — HTTP calls fail when the receiver is offline." },

    { type: "mc",
      q: "A consultant reports \"the app was slow this morning and some users saw errors.\" As the engineer on support, your first stop is:",
      hint: "Evidence before action. Which service recorded every request, exception, and timing?",
      opts: [
        "Application Insights — check request rates, failures, and exception traces for that window",
        "Restart the App Service and hope",
        "Ask the consultant to screenshot the error",
        "Redeploy last week's version"
      ], a: 0,
      why: "App Insights auto-collects requests, dependencies, exceptions, and timings. Evidence before action — this is the supportability half of your new role in one sentence." },

    { type: "lesson", title: "Shipping it: CI/CD & deployment slots",
      body: `
<p>Code doesn't walk to production — a <b>pipeline</b> carries it (Azure DevOps or GitHub Actions). Every push to main triggers the same trustworthy sequence:</p>
<pre class="code">push to main
  → CI: build + unit tests          (broken code stops here)
  → deploy to the STAGING slot
  → run Cypress E2E against staging (real app, safe environment)
  → SWAP staging ⇄ production
  → watch App Insights</pre>
<p><b>Deployment slots</b> are the star of that sequence. An App Service can host multiple copies of your app — production plus a <i>staging</i> slot. You deploy to staging, test it with real requests, then <b>swap</b>:</p>
<ul>
<li><b>Zero downtime</b> — the swap redirects traffic between already-warm instances.</li>
<li><b>Instant rollback</b> — something's wrong? Swap back. The old version is still right there.</li>
<li><b>No cold start</b> — staging is warmed up before it ever sees production traffic.</li>
</ul>
<p><b>Per-environment configuration</b>: the same build runs in test and prod — only settings differ. App Service <i>application settings</i> override appsettings.json, and can be marked "slot-sticky" (the staging slot keeps its test database connection even after a swap).</p>
<p>Notice how the pieces you're learning interlock: the pipeline runs your <i>Cypress</i> suite, deploys your <i>C#</i> API, which reads secrets via its <i>managed identity</i> — and you verify the swap in <i>App Insights</i>.</p>` },

    { type: "parsons",
      q: "Put the delivery pipeline in order — from a push to main to verified production.",
      hint: "Build & test first (fail fast), then staging, then E2E against staging, then swap, then watch.",
      lines: [
        "Developer pushes to the main branch",
        "CI builds the solution and runs unit tests",
        "The app is deployed to the staging slot",
        "Cypress E2E tests run against staging",
        "Staging is swapped into production (zero downtime)",
        "App Insights dashboards confirm the release is healthy"
      ],
      why: "Each gate catches what the previous one can't: unit tests catch logic bugs, E2E catches integration bugs, the swap makes release boring, and App Insights catches what testing missed. Boring releases are the goal." },

    { type: "mc",
      q: "What makes a deployment-slot <b>swap</b> safer than deploying straight to production?",
      hint: "Three wins: downtime, rollback, warm-up.",
      opts: [
        "Slots run on faster hardware",
        "Zero-downtime cutover between warm instances, and instant rollback by swapping back",
        "Swaps skip the build step",
        "Slots bypass authentication"
      ], a: 1,
      why: "The swap is a traffic redirect between already-running, already-warmed copies — users never hit a cold or half-deployed app. And the previous version stays live in the other slot, so rollback is one more swap." },

    { type: "mc",
      q: "The same build must use a test database in staging and the real one in production. Where does that difference live?",
      hint: "Not in the code — the build is identical. What overrides appsettings.json per environment?",
      opts: [
        "An #if PRODUCTION compiler directive",
        "App Service application settings (slot-sticky), overriding appsettings.json per environment",
        "Two different git branches",
        "A config table inside the production database"
      ], a: 1,
      why: "Build once, configure per environment: App Service settings override appsettings.json, and slot-sticky settings stay with their slot through swaps — staging keeps pointing at test data. Rebuilding per environment invites \"works in staging\" bugs." }
  ],
  boss: { name: "The Config Kraken", icon: "🐙",
    intro: "Its tentacles are hardcoded connection strings. Land 3 hits to cut them.",
    questions: [
      { type: "mc",
        q: "Service Bus: queue vs topic — what's the difference?",
        hint: "Point-to-point vs pub/sub broadcast.",
        opts: [
          "Queues are faster but lose messages",
          "A queue delivers each message to one consumer; a topic publishes to multiple independent subscriptions",
          "Topics only carry text",
          "Queues are Azure-only, topics are AWS"
        ], a: 1,
        why: "Queue = point-to-point work distribution. Topic = pub/sub broadcast: a TradeSettled event can feed the reporting service, the notification service, and the audit service, each via its own subscription." },
      { type: "mc",
        q: "Scaling <b>up</b> vs scaling <b>out</b> — which is which?",
        hint: "Up = the machine grows. Out = the machines multiply.",
        opts: [
          "Up = more instances; out = bigger machine",
          "Up = a bigger machine (more CPU/RAM); out = more instances behind a load balancer",
          "Both mean adding regions",
          "Out only applies to databases"
        ], a: 1,
        why: "Vertical (up) has a ceiling and a single point of failure; horizontal (out) is how cloud apps handle load — but requires your app to be stateless enough to run multiple copies." },
      { type: "mc",
        q: "What does a <b>managed identity</b> give your App Service?",
        hint: "It solves 'where do I put the secret that unlocks the secrets?'",
        opts: [
          "A custom domain name",
          "An Azure AD identity so it can authenticate to Key Vault/SQL/Storage without any stored credentials",
          "A dedicated public IP",
          "Faster cold starts"
        ], a: 1,
        why: "The app gets an identity from Azure itself and other services grant it access directly — no connection secrets to store, rotate, or leak." }
    ]
  }
},
{
  id: "cypress", name: "Cypress Proving Grounds", icon: "🧪", color: "#69d3a7",
  desc: "Write real E2E tests: the command queue, selectors, stubbing.",
  questions: [

    { type: "lesson", title: "How Cypress thinks",
      body: `
<p>Cypress runs <b>inside the browser</b>, next to your app — that's what makes it different from Selenium-style tools that drive the browser remotely. Two consequences shape every test you'll write:</p>
<p><b>1. Commands are enqueued, not executed.</b> When your test function runs, <code>cy.get()</code> doesn't touch the DOM — it adds a command to a queue that executes afterwards, serially:</p>
<pre class="code">const btn = cy.get('#save');  // ❌ NOT an element — a queued command
btn.click();                  //    (queued too)
console.log('hi');            //    runs BEFORE any of the above!

cy.get('#save').click();      // ✅ chain commands instead
cy.get('h1').should('have.text', 'Welcome');  // ✅ assert via should</pre>
<p><b>2. Everything retries.</b> <code>cy.get</code> re-queries and <code>should</code> re-asserts until they pass or time out. So this "just works" while data loads:</p>
<pre class="code">cy.get('[data-cy="trade-row"]').should('have.length', 3);
// keeps retrying until 3 rows exist — no sleep needed</pre>
<p>That's why <code>cy.wait(5000)</code>-style fixed sleeps are a smell: retry-ability already waits exactly as long as needed, no more, no less.</p>` },

    { type: "mc",
      q: "Why doesn't this work?",
      hint: "Lesson point #1 — what does cy.get() actually return when the test function runs?",
      code: "const button = cy.get('#save');\nbutton.click();\nconsole.log('clicked!'); // logs BEFORE the click",
      opts: [
        "cy.get needs an await keyword",
        "Cypress commands don't run immediately — they're enqueued and executed serially later, so cy.get doesn't return an element",
        "#save is an invalid selector",
        "You must use cy.find instead"
      ], a: 1,
      why: "Cypress commands build a queue that runs after the test function finishes. <code>cy.get()</code> returns a chainable, not an element. To use a value, chain <code>.then(el => ...)</code>." },

    { type: "bug",
      q: "This test fails with 'expected undefined to equal Welcome'. Click the broken line.",
      hint: "One line treats a queued command like it's a real element with a .text() value.",
      code: [
        "it('shows the welcome header', () => {",
        "  cy.visit('/dashboard');",
        "  const text = cy.get('h1').text();",
        "  expect(text).to.equal('Welcome');",
        "});"
      ], a: 2,
      why: "<code>cy.get()</code> returns a command chainable, not a jQuery element — there's no <code>.text()</code> value to grab synchronously. Write <code>cy.get('h1').should('have.text', 'Welcome')</code> instead." },

    { type: "mc",
      q: "Why does a Cypress assertion like <code>cy.get('.spinner').should('not.exist')</code> usually need no manual wait before it?",
      hint: "Lesson point #2.",
      opts: [
        "Cypress tests run slower than the app",
        "Cypress automatically retries queries and assertions until they pass or a timeout is hit",
        "The spinner is removed at compile time",
        "should() pauses for exactly 5 seconds"
      ], a: 1,
      why: "Retry-ability is Cypress's core feature: it keeps re-querying the DOM until the assertion holds. That's why explicit sleeps are almost always unnecessary — and a smell." },

    { type: "lesson", title: "Writing a test",
      body: `
<p>The skeleton of nearly every Cypress test — arrange, act, assert:</p>
<pre class="code">it('logs in', () => {
  cy.visit('/login');                              // go to the page
  cy.get('[data-cy="username"]').type('victory');  // find + type
  cy.get('[data-cy="submit"]').click();            // find + click
  cy.get('[data-cy="welcome"]')
    .should('contain.text', 'Victory');            // assert (and wait)
});</pre>
<p>The commands you'll use hourly:</p>
<ul>
<li><code>cy.visit(url)</code> — navigate</li>
<li><code>cy.get(selector)</code> — find elements (retries until found)</li>
<li><code>.type(text)</code> / <code>.click()</code> — interact</li>
<li><code>.should('have.length', 3)</code> / <code>.should('contain.text', …)</code> — assert</li>
</ul>
<p><b>Selector strategy matters.</b> CSS classes and DOM paths (<code>.btn-primary</code>, <code>div:nth-child(3)</code>) break when a designer touches the page. Dedicated test attributes survive any refactor:</p>
<pre class="code">&lt;button data-cy="save-button"&gt;Save&lt;/button&gt;
cy.get('[data-cy="save-button"]').click();   // ✅ best practice</pre>` },

    { type: "multifill",
      q: "Complete this login test: navigate to the page, type the username, click submit.",
      hint: "The lesson skeleton: visit → type → click.",
      code: "it('logs in', () => {\n  cy.{{0}}('/login');\n  cy.get('[data-cy=\"username\"]').{{1}}('victory');\n  cy.get('[data-cy=\"submit\"]').{{2}}();\n  cy.get('[data-cy=\"welcome\"]').should('contain.text', 'Victory');\n});",
      blanks: [["visit"], ["type"], ["click"]],
      why: "<code>visit → get → type/click → should</code> is the skeleton of nearly every Cypress test. Note the <code>data-cy</code> selectors — stable against styling refactors." },

    { type: "fill",
      q: "Fill in the assertion checking that exactly 3 rows rendered.",
      hint: "should('have.____', 3) — the property that counts elements.",
      code: "cy.get('[data-cy=\"trade-row\"]').should('have.____', 3);",
      a: ["length"],
      why: "<code>.should('have.length', 3)</code> asserts the count — and retries until it passes or times out, so it also <i>waits</i> for the rows to appear. Assertions double as smart waits." },

    { type: "mc",
      q: "Which selector is most recommended by Cypress best practices?",
      hint: "Which one survives a designer restyling the whole page?",
      opts: [
        "cy.get('.btn.btn-primary.mt-2')",
        "cy.get('#root > div:nth-child(3) > button')",
        "cy.get('[data-cy=\"save-button\"]')",
        "cy.get('button').eq(4)"
      ], a: 2,
      why: "Dedicated test attributes (<code>data-cy</code>/<code>data-testid</code>) are immune to styling and layout refactors. CSS classes and DOM paths make tests brittle." },

    { type: "lesson", title: "Network control: intercept & wait",
      body: `
<p>E2E tests get flaky when they depend on real APIs. <code>cy.intercept()</code> puts the network under your control:</p>
<pre class="code">it('shows trades from the API', () => {
  // 1. stub the request — BEFORE the page that makes it loads
  cy.intercept('GET', '/api/trades', { fixture: 'trades.json' })
    .as('getTrades');                 // 2. name it with an alias

  cy.visit('/trades');                // 3. page loads, request is stubbed

  cy.wait('@getTrades');              // 4. wait for THAT request — not 5 seconds

  cy.get('[data-cy="trade-row"]').should('have.length', 3);
});</pre>
<ul>
<li><b>Order matters</b>: intercept before visit, or the page's request escapes the stub.</li>
<li><b>Fixtures</b> are canned JSON responses — the UI is tested against controlled data. You can also stub errors (<code>{ statusCode: 500 }</code>) to test failure handling.</li>
<li><b><code>cy.wait('@alias')</code></b> pins the test to the actual request finishing. Compare with <code>cy.wait(5000)</code>: too short on a slow CI runner (flaky), wasted time on a fast one. Never sleep for a fixed time.</li>
<li>Keep tests <b>independent</b>: each test visits its own page and stubs its own data — test B must not depend on test A having run.</li>
</ul>` },

    { type: "parsons",
      q: "Assemble this test so it's deterministic — the network stub must be registered <b>before</b> the page that calls it loads.",
      hint: "it( → intercept+alias → visit → wait for the alias → assert → close. The lesson example, line for line.",
      lines: [
        "it('shows trades from the API', () => {",
        "  cy.intercept('GET', '/api/trades', { fixture: 'trades.json' }).as('getTrades');",
        "  cy.visit('/trades');",
        "  cy.wait('@getTrades');",
        "  cy.get('[data-cy=\"trade-row\"]').should('have.length', 3);",
        "});"
      ],
      why: "Intercept <b>before</b> visit, or the page's request escapes the stub. Then <code>cy.wait('@getTrades')</code> pins the test to the real request finishing — no arbitrary sleeps." },

    { type: "mc",
      q: "What is <code>cy.intercept()</code> for?",
      hint: "It puts one specific thing under the test's control…",
      opts: [
        "Blocking the user from clicking",
        "Spying on or stubbing network requests — e.g., serve fake API data or wait for a request to finish",
        "Intercepting keyboard shortcuts",
        "Catching JavaScript exceptions"
      ], a: 1,
      why: "<code>cy.intercept('GET', '/api/trades', { fixture: 'trades.json' })</code> lets you test the UI with controlled data, simulate errors, and — aliased with <code>.as()</code> — wait for specific requests deterministically." },

    { type: "lesson", title: "Keeping suites maintainable",
      body: `
<p>A 5-test suite survives anything. A 500-test suite survives only with discipline:</p>
<p><b>1. Shared setup goes in <code>beforeEach</code></b> — it runs before every test in the block, guaranteeing each test starts from the same clean state:</p>
<pre class="code">describe('trade blotter', () => {
  beforeEach(() => {
    cy.login('victory');       // every test starts logged in
    cy.visit('/trades');
  });

  it('filters by symbol', () => { /* already logged in & on the page */ });
  it('sorts by amount',   () => { /* same here */ });
});</pre>
<p><b>2. Repeated flows become custom commands</b> — defined once in <code>cypress/support/commands.js</code>, available everywhere as <code>cy.yourCommand()</code>:</p>
<pre class="code">Cypress.Commands.add('login', (user) => {
  cy.request('POST', '/api/auth/login', { username: user });  // API call!
});</pre>
<p><b>3. Log in through the API, not the UI.</b> <code>cy.request</code> hits the endpoint directly — milliseconds instead of seconds of form-filling, repeated across hundreds of tests. The login <i>form</i> gets its own dedicated test; everything else just needs to <i>be</i> logged in.</p>
<p><b>4. Fixtures</b> (<code>cypress/fixtures/trades.json</code>) hold canned test data — versioned with the code, shared across tests, and served through <code>cy.intercept</code> so the UI is tested against stable, controlled responses.</p>` },

    { type: "multifill",
      q: "Complete the fast programmatic login: define a reusable command that hits the auth API directly (no UI form).",
      hint: "Commands are ____ed onto Cypress.Commands; the direct-HTTP command is cy.____ (not cy.visit).",
      code: "// cypress/support/commands.js\nCypress.Commands.{{0}}('login', (user) => {\n  cy.{{1}}('POST', '/api/auth/login', { username: user });\n});\n\n// any spec file:\nbeforeEach(() => cy.login('victory'));",
      blanks: [["add"], ["request"]],
      why: "<code>Cypress.Commands.add</code> registers a reusable command; <code>cy.request</code> calls the API directly — no form-filling. Hundreds of tests × seconds saved per login = a suite that finishes before lunch." },

    { type: "mc",
      q: "Why log in via <code>cy.request('POST', '/api/auth/login', ...)</code> in beforeEach instead of typing into the login form in every test?",
      hint: "How many times does the login FORM itself need testing?",
      opts: [
        "cy.request bypasses security so tests always pass",
        "It's much faster and less brittle — the login UI gets tested once in its own dedicated test, not re-executed 500 times",
        "The login form can't be automated",
        "beforeEach can't use cy.get"
      ], a: 1,
      why: "UI login in every test multiplies slowness and flakiness by your suite size. Test the form once, then authenticate programmatically everywhere else — a core Cypress best practice." },

    { type: "mc",
      q: "What is a Cypress <b>fixture</b>?",
      hint: "It lives in cypress/fixtures/ and often feeds cy.intercept.",
      opts: [
        "A hook that runs after each test",
        "A canned data file (e.g., trades.json) used as stable test data, often served via cy.intercept",
        "A browser extension for Cypress",
        "The HTML skeleton of the test runner"
      ], a: 1,
      why: "Fixtures are versioned, reusable test data. Combined with <code>cy.intercept('GET', '/api/trades', { fixture: 'trades.json' })</code>, your UI tests run against controlled responses — deterministic and API-independent." }
  ],
  boss: { name: "The Flaky Phantom", icon: "🎃",
    intro: "It makes tests pass on your machine and fail in CI. Land 3 hits to exorcise it.",
    questions: [
      { type: "bug",
        q: "This test is slow and still flaky in CI. Click the line that's the anti-pattern.",
        hint: "One line waits for a fixed time instead of waiting for the aliased request.",
        code: [
          "it('loads trades', () => {",
          "  cy.intercept('GET', '/api/trades').as('getTrades');",
          "  cy.visit('/trades');",
          "  cy.wait(5000);",
          "  cy.get('[data-cy=\"trade-row\"]').should('exist');",
          "});"
        ], a: 3,
        why: "Fixed sleeps are the #1 flakiness source: too short on a slow CI runner, wasted time on a fast one. The intercept is already aliased — use <code>cy.wait('@getTrades')</code> to wait for the actual request." },
      { type: "mc",
        q: "Test B passes alone but fails after test A runs. The likely cause?",
        hint: "What do the tests accidentally share?",
        opts: [
          "Cypress randomizes test order",
          "Tests share state (login, data, URL) instead of each setting up its own — fix with beforeEach setup and independent tests",
          "CI machines can't run two tests",
          "The describe block is too long"
        ], a: 1,
        why: "Test isolation: each test should be runnable alone — visit its page, seed/stub its data, authenticate itself. Order-dependent tests rot fast." },
      { type: "mc",
        q: "<code>cy.contains('Delete')</code> vs <code>cy.get('[data-cy=\"delete-btn\"]')</code> — a real risk of the contains approach?",
        hint: "What happens when a second 'Delete' appears on the page, or the copy changes?",
        opts: [
          "contains is not a real command",
          "It matches the first element containing that text anywhere — a different 'Delete' elsewhere (or changed copy) breaks or misfires the test",
          "contains can't be chained with click",
          "contains only searches inputs"
        ], a: 1,
        why: "Text-based selection couples tests to copywriting and matches greedily. <code>contains</code> is fine for asserting text is <i>visible</i>, but for targeting actions, stable data attributes win." }
    ]
  }
}
];
