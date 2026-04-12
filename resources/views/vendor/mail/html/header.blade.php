@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
@if (trim($slot) === 'Laravel')
SIM-KKN UIN SAIZU
@else
{!! $slot !!}
@endif
</a>
</td>
</tr>
