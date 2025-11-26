from django.shortcuts import render, redirect, get_object_or_404
from .forms import TodoForm
from django.db.models import Q
from .models import Todo

def home(request):
    search_query = request.GET.get("search", "")
    todos = Todo.objects.all().order_by("completed", "due_date")

    if search_query:
        todos = todos.filter(Q(title__icontains=search_query))

    # progress
    total = todos.count()
    completed = todos.filter(completed=True).count()
    progress = int((completed / total) * 100) if total > 0 else 0

    if request.method == "POST":
        form = TodoForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect("/")
    else:
        form = TodoForm()

    return render(request, "todos/home.html", {
        "todos": todos,
        "form": form,
        "progress": progress,
        "search": search_query,
    })


def toggle_complete(request, id):
    todo = get_object_or_404(Todo, id=id)
    todo.completed = not todo.completed
    todo.save()
    return redirect("/")


def delete_task(request, id):
    todo = get_object_or_404(Todo, id=id)
    todo.delete()
    return redirect("/")


def edit_task(request, id):
    todo = get_object_or_404(Todo, id=id)
    if request.method == "POST":
        form = TodoForm(request.POST, instance=todo)
        if form.is_valid():
            form.save()
            return redirect("/")
    else:
        form = TodoForm(instance=todo)

    return render(request, "todos/edit.html", {"form": form, "todo": todo})
