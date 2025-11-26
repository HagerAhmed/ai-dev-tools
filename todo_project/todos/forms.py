from django import forms
from .models import Todo

class TodoForm(forms.ModelForm):
    class Meta:
        model = Todo
        fields = ['title', 'priority', 'due_date', 'completed']

        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control'}),
            'priority': forms.Select(attrs={'class': 'form-control'}),
            'completed': forms.CheckboxInput(attrs={'class': 'form-check-input'}),

            'due_date': forms.DateInput(
                attrs={
                    'class': 'form-control datepicker',
                    'placeholder': 'Select date'
                }
            )
        }
