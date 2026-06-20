string[] pallets = [ "B14", "A11", "B12", "A13" ];

Console.WriteLine("Sorted...");
Array.Sort(pallets); // We sort the array alphanumerically

foreach (var pallet in pallets) 
{
    Console.WriteLine($"-- {pallet}");
}

Array.Reverse(pallets);
Console.WriteLine("Reversed");
foreach (var pallet in pallets)
{
    Console.WriteLine($"{pallet}");
}

// Array.Clear() eliminates the contents of specific elements in the array
// It replaces them with the array's default value (i.e. null for strings, 0 for ints)
Array.Clear(pallets, 0, 2);
Console.WriteLine("Clearing");
foreach (var pallet in pallets)
{
    Console.WriteLine($"-- {pallet}");
}

// Array.Resize() allows us to add or remove elements from our array
