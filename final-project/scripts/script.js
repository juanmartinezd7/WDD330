const form = document.getElementById('searchForm');
const recipeList = document.getElementById('recipeList');
const ingredientList = document.getElementById('ingredientList');
const groceryList = document.getElementById('groceryList');
const categorySelect = document.getElementById('categorySelect');
const clearBtn = document.getElementById('clearBtn');

let selectedRecipeItem = null;

// Load categories from TheMealDB
async function loadCategories() {
    const res = await fetch('https://www.themealdb.com/api/json/v1/1/list.php?c=list');
    const data = await res.json();
    data.meals.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.strCategory;
        option.textContent = cat.strCategory;
        categorySelect.appendChild(option);
    });
}

loadCategories();

form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const query = document.getElementById('recipeInput').value.trim().toLowerCase();
    const category = categorySelect.value;

    recipeList.innerHTML = '';
    ingredientList.innerHTML = '';
    groceryList.innerHTML = '';
    selectedRecipeItem = null;

    let meals = [];

    // Case 1: user entered a search term
    if (query) {
        const recipeRes = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${query}`);
        const recipeData = await recipeRes.json();
        meals = recipeData.meals || [];
        if (category) {
            meals = meals.filter(meal => meal.strCategory === category);
        }
    }
    // Case 2: no search term, but user selected a category
    else if (category) {
        const catRes = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=${category}`);
        const catData = await catRes.json();
        meals = catData.meals || [];
    }

    if (!meals || meals.length === 0) {
        recipeList.innerHTML = '<li>No recipes found.</li>';
        return;
    }

    meals.forEach(meal => {
        const recipeItem = document.createElement('li');
        recipeItem.textContent = meal.strMeal;
        recipeItem.style.cursor = 'pointer';
        recipeItem.addEventListener('click', async () => {
            if (selectedRecipeItem) {
                selectedRecipeItem.classList.remove('selected');
            }
            recipeItem.classList.add('selected');
            selectedRecipeItem = recipeItem;

            // If this meal came from the category filter, fetch full details
            const id = meal.idMeal;
            const detailRes = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
            const detailData = await detailRes.json();
            const fullMeal = detailData.meals[0];
            loadMealDetails(fullMeal);
        });

        recipeList.appendChild(recipeItem);
    });
});



clearBtn.addEventListener('click', () => {
    document.getElementById('recipeInput').value = '';
    categorySelect.value = '';
    recipeList.innerHTML = '';
    ingredientList.innerHTML = '';
    groceryList.innerHTML = '';
    selectedRecipeItem = null;

    // Clear recipe details and set placeholder image
    const mealThumb = document.getElementById('mealThumb');
    mealThumb.src = 'images/meal.JPG';
    mealThumb.alt = 'No recipe selected';

    document.getElementById('mealArea').textContent = '';
    document.getElementById('mealTags').textContent = '';
    document.getElementById('instructionsText').textContent = '';
});


async function loadMealDetails(meal) {
    ingredientList.innerHTML = '';
    groceryList.innerHTML = '';
    document.getElementById('instructionsText').textContent = '';

    const apiKey = "W0Xmo9WM5sieQnG2SrgnuxEMNmtJntr79ghBtltm"; //  USDA key

    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];
        if (ingredient && ingredient.trim()) {
            ingredients.push({ name: ingredient, quantity: measure });
        }
    }

    for (const item of ingredients) {
        const li = document.createElement('li');
        li.textContent = `${item.quantity || ''} ${item.name}`;
        ingredientList.appendChild(li);

        try {
            const searchURL = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(item.name)}&pageSize=1&api_key=${apiKey}`;
            const groceryRes = await fetch(searchURL);
            const groceryData = await groceryRes.json();
            const product = groceryData.foods?.[0];

            const productLi = document.createElement('li');

            if (product) {
                productLi.innerHTML = `<strong>${product.description}</strong> - FDC ID: ${product.fdcId}`;
            } else {
                productLi.textContent = `No product found for: ${item.name}`;
            }

            groceryList.appendChild(productLi);

        } catch (err) {
            console.warn(`Error fetching USDA product for ${item.name}:`, err);
            // Optionally skip or show a message
        }
    }

    // Show cooking instructions
    document.getElementById('instructionsText').textContent = meal.strInstructions || 'No instructions available.';

    // Show image
    const mealThumb = document.getElementById('mealThumb');
    if (mealThumb) {
        mealThumb.src = meal.strMealThumb || '';
        mealThumb.alt = meal.strMeal || 'Meal Image';
    }

    // Show region
    const areaEl = document.getElementById('mealArea');
    if (areaEl) areaEl.textContent = meal.strArea || 'Unknown';

    // Show tags
    const tagsEl = document.getElementById('mealTags');
    if (tagsEl) tagsEl.textContent = meal.strTags ? meal.strTags.split(',').join(', ') : 'None';
}
